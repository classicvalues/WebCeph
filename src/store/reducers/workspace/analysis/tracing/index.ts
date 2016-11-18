import assign from 'lodash/assign';
import omit from 'lodash/omit';
import map from 'lodash/map';
import every from 'lodash/every';
import uniqBy from 'lodash/uniqBy';
import negate from 'lodash/negate';
import { handleActions } from 'redux-actions';
import { createSelector } from 'reselect';
import { Event, StoreKeys } from 'utils/constants';
import { printUnexpectedPayloadWarning } from 'utils/debug';
import manualLandmarks, { getManualLandmarks } from './manualLandmarks';
import { isImageFlippedX } from 'store/reducers/workspace/image';
import { line, isCephaloPoint, isCephaloLine, isCephaloAngle } from 'analyses/helpers';
import { isGeometricalPoint, isBehind } from 'utils/math';

type SkippedSteps = StoreEntries.workspace.analysis.tracing.steps.skipped;
type TracingMode = StoreEntries.workspace.analysis.tracing.mode;
type ScaleFactor = StoreEntries.workspace.analysis.tracing.scaleFactor;

const defaultTracingMode: TracingMode = 'assisted';
const defaultSkippedSteps: SkippedSteps = { };
const defaultScaleFactor: ScaleFactor = null;

const KEY_TRACING_MODE = StoreKeys.tracingMode;
const KEY_SKIPPED_STEPS = StoreKeys.skippedSteps;
const KEY_SCALE_FACTOR = StoreKeys.scaleFactor;

const tracingMode = handleActions<TracingMode, Payloads.setTracingMode>(
  {
    [Event.SET_TRACING_MODE_REQUESTED]: (state, { payload: mode, type }) => {
      if (mode === undefined) {
        printUnexpectedPayloadWarning(type, state);
        return state;
      }
      return mode;
    },
  },
  defaultTracingMode,
);

const skippedSteps = handleActions<
  SkippedSteps,
  Payloads.skipStep | Payloads.unskipStep
>(
  {
    [Event.SKIP_MANUAL_STEP_REQUESTED]: (state, { payload: step, type }) => {
      if (step === undefined) {
        printUnexpectedPayloadWarning(type, state);
        return state;
      }
      return assign({ }, state, { [step]: true });
    },
    [Event.UNSKIP_MANUAL_STEP_REQUESTED]: (state, { payload: step, type }) => {
      if (step === undefined) {
        printUnexpectedPayloadWarning(type, state);
        return state;
      }
      return omit(state, step);
    },
    [Event.RESET_WORKSPACE_REQUESTED]: () => defaultSkippedSteps,
  },
  defaultSkippedSteps,
);

const scaleFactorReducer = handleActions<
  ScaleFactor,
  Payloads.setScaleFactor | Payloads.unsetScaleFactor
>(
  {
    [Event.SET_SCALE_FACTOR_REQUESTED]: (state, { payload: scaleFactor, type }) => {
      if (scaleFactor === undefined) {
        printUnexpectedPayloadWarning(type, state);
        return state;
      }
      return scaleFactor;
    },
    [Event.UNSET_SCALE_FACTOR_REQUESTED]: (state, { payload, type }) => {
      if (payload !== undefined) {
        printUnexpectedPayloadWarning(type, state);
        return state;
      }
      return null;
    },
    [Event.RESET_WORKSPACE_REQUESTED]: () => defaultScaleFactor,
  },
  defaultScaleFactor,
);

export default assign({
  [KEY_TRACING_MODE]: tracingMode,
  [KEY_SKIPPED_STEPS]: skippedSteps,
  [KEY_SCALE_FACTOR]: scaleFactorReducer,
}, manualLandmarks);

export const isLandmarkRemovable = createSelector(
  getManualLandmarks,
  ({ present: manualLandmarks }) => (symbol: string) => manualLandmarks[symbol] !== undefined,
);

export const getScaleFactor = (state: GenericState): ScaleFactor => state[KEY_SCALE_FACTOR];

export const getCephaloMapper = createSelector(
  getManualLandmarks,
  getScaleFactor,
  isImageFlippedX,
  ({ present: manual }, scaleFactor, isFlippedX): CephaloMapper => {
    const toPoint = (cephaloPoint: CephaloPoint) => {
      const { symbol } = cephaloPoint;
      if (!isCephaloPoint(cephaloPoint)) {
        console.warn(
          `CephaloMapper.toPoint was called with ${symbol}, ` +
          `but ${symbol} does not conform to the CephaloPoint interface.`,
        );
      }
      const geoLandmark = manual[symbol];
      if (!isGeometricalPoint(geoLandmark)) {
        console.warn(
          `CephaloMapper.toPoint tried to map ${symbol}, ` +
          `which is a CephaloPoint, to a geometrical representation that ` +
          `does not conform the the GeometricalPoint interface.`,
          geoLandmark,
          cephaloPoint,
          manualLandmarks,
        );
      }
      return geoLandmark as GeometricalPoint;
    };

    const toVector = (cephaloLine: CephaloLine) => {
      const { symbol } = cephaloLine;
      if (!isCephaloLine(cephaloLine)) {
        console.warn(
          `CephaloMapper.toVector was called with ${symbol}, ` +
          `but ${symbol} does not conform to the CephaloLine interface.`,
        );
      }
      const [A, B] = map(cephaloLine.components, toPoint);
      return {
        x1: A.x,
        y1: A.y,
        x2: B.x,
        y2: B.y,
      };
    };

    const toAngle = (cephaloAngle: CephaloAngle): GeometricalAngle => {
      let vectors: CephaloLine[];
      if (every(cephaloAngle.components, isCephaloPoint)) {
        const [A, B, C] = cephaloAngle.components as CephaloPoint[];
        vectors = [line(A, B), line(B, C)];
      } else if (every(cephaloAngle.components, isCephaloAngle)) {
        let A: CephaloPoint, B: CephaloPoint, C: CephaloPoint;
        const [angle1, angle2] = cephaloAngle.components;
        const components = [...angle1.components, ...angle2.components];
        if (every(components, isCephaloPoint)) {
          [A, B, C] = uniqBy(
            components as CephaloPoint[],
            c => c.symbol
          );
          vectors = [line(A, B), line(B, C)];
        } else if (every(components, isCephaloLine)) {
          [A, B, C] = uniqBy(
            [
              ...angle1.components[1].components,
              ...angle2.components[1].components,
            ] as CephaloPoint[],
            c => c.symbol,
          );
          vectors = [line(A, B), line(B, C)];
        } else {
          console.warn(
            `CephaloMapper.toAngle was called with ${cephaloAngle.symbol}, ` +
            `but ${cephaloAngle.symbol} components did not match any of the ` +
            `CephaloAngle components interfaces.`,
          );
          vectors = [];
        }
      } else if (every(cephaloAngle.components, isCephaloLine)) {
        vectors = cephaloAngle.components as CephaloLine[];
      } else {
        console.warn(
          `CephaloMapper.toAngle was called with ${cephaloAngle.symbol}, ` +
          `but ${cephaloAngle.symbol} components did not match any of the ` +
          `CephaloAngle components interfaces.`,
        );
        vectors = [];
      }
      return {
        vectors: map(vectors, toVector),
      };
    };

    return {
      toPoint,
      toVector,
      toAngle,
      scaleFactor,
      isBehind: isFlippedX ? negate(isBehind) : isBehind,
    };
  }
);

export { getManualLandmarks };