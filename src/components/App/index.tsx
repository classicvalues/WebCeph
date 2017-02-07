import * as React from 'react';

import VerticalTabBar from 'components/VerticalTabBar/connected';
import Workspace from 'components/Workspace/connected';

import Progress from './Progress';

import getMuiTheme from 'material-ui/styles/getMuiTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';

import injectTapEventPlugin from 'react-tap-event-plugin';

import attempt from 'lodash/attempt';

import { compose, lifecycle, pure } from 'recompose';

import { IntlProvider, FormattedMessage } from 'react-intl';

import Props from './props';

attempt(injectTapEventPlugin);

type State = { };

const classes = require('./style.scss');

const addLifeCycleHooks = lifecycle({
  componentDidMount(this: React.Component<Props, { }>) {
    this.props.onComponentMount();
  },
});

const enhance = compose<Props, State>(pure, addLifeCycleHooks);

import { HotKeys } from 'react-hotkeys';

const App = enhance(({
  userAgent, isReady, keyMap, handlers,
  shouldShowWorkspaceSwitcher,
  activeWorkspaceId,
  locale, messages,
}: Props) => (
    <MuiThemeProvider muiTheme={getMuiTheme()}>
      { isReady ? (
          <IntlProvider key={locale} defaultLocale="en" locale={locale} messages={messages}>
            <HotKeys keyMap={keyMap} handlers={handlers}>
              <div className={classes.root}>
                <div className={classes.container}>
                  <div className={classes.row}>
                    {shouldShowWorkspaceSwitcher ? (
                      <VerticalTabBar
                        className={classes.tab_bar}
                      />
                    ) : null}
                    <Workspace className={classes.workspace} workspaceId={activeWorkspaceId} />
                  </div>
                </div>
              </div>
            </HotKeys>
          </IntlProvider>
        ) : (
          <div className={classes.root_loading}>
            <Progress />
          </div>
        )
      }
    </MuiThemeProvider>
));

export default App as React.ComponentClass<Props>;
