import * as React from 'react';
import * as Dropzone from 'react-dropzone';
import * as cx from 'classnames';
import RaisedButton from 'material-ui/RaisedButton';
import FlatButton from 'material-ui/FlatButton';
// import join from 'lodash/join';
import Props from './props';

const classes = require('./style.scss');
const DropzonePlaceholder = require(
  'svg-react-loader?name=DropzonePlaceholder!svgo-loader?useConfig=svgoConfig!./assets/placeholder.svg'
) as React.SFCFactory<React.SVGAttributes<SVGElement>>;

const demoButtonStyle = { marginTop: 5 };

class CephaloDropzone extends React.PureComponent<Props, { }> {
  refs: {
    dropzone: null | React.ReactInstance & { open: () => void; }
  };


  render() {
    const {
      onFilesDropped,
      onDemoButtonClick,
      // supportedImageTypes = [
      //   'image/jpeg',
      //   'image/png',
      //   'image/bmp',
      //   'application/wceph',
      //   'application/zip',
      // ],
      allowsMultipleFiles = false,
    } = this.props;
    return (
      <Dropzone
        ref="dropzone"
        className={classes.dropzone}
        activeClassName={classes.dropzone__active}
        rejectClassName={classes.dropzone__reject}
        onDrop={onFilesDropped}
        multiple={allowsMultipleFiles}
        disableClick
        disablePreview
      >
        <div className={classes.dropzone_placeholder}>
          <DropzonePlaceholder className={classes.dropzone_placeholder_image} />
          <span className={cx(classes.dropzone_placeholder_text, classes.text_center, classes.muted)}>
            To start tracing, drop a cephalometric radiograph here or
          </span>
          <RaisedButton
            primary
            label="Click to pick an image"
            onClick={this.openFilePicker}
          />
        </div>
        <div className={cx(classes.dropzone_load_demo, classes.text_center)}>
          <small
            className={classes.muted}
          >
            Don't have one around? Try a sample image from Wikipedia!
          </small>
          <br />
          <FlatButton
            secondary
            primary
            style={demoButtonStyle}
            label="Load sample image"
            onClick={onDemoButtonClick}
          />
        </div>
      </Dropzone>
    );
  };

  private setRef = (node: any) => this.refs.dropzone = node;
  private openFilePicker = () => {
    if (this.refs.dropzone !== null) {
      this.refs.dropzone.open();
    }
  }
};

export default CephaloDropzone;
