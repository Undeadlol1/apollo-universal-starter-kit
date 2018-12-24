import React from 'react';
import PropTypes from 'prop-types';
import path from 'path';
import { DocumentPicker, MediaLibrary, Constants, FileSystem, Permissions } from 'expo';
import { ReactNativeFile } from 'apollo-upload-client';
import * as mime from 'react-native-mime-types';
import url from 'url';

import uploadConfig from '../../../../config/upload';
import UploadView from '../components/UploadView';

const {
  manifest: { bundleUrl }
} = Constants;
const { protocol, host, hostname, port } = url.parse(__API_URL__);
const serverUrl = `${protocol}//${
  hostname === 'localhost' ? url.parse(bundleUrl).hostname + (port ? ':' + port : '') : host
}`;

export default class FileOperations extends React.Component {
  static propTypes = {
    loading: PropTypes.bool.isRequired,
    t: PropTypes.func.isRequired
  };

  state = {
    notify: null,
    isDownload: false
  };

  handleRemoveFile = async id => {
    const { removeFile } = this.props;
    const result = await removeFile(id);

    this.setState({ error: result && result.error ? result.error : null });
  };

  handleUploadFile = async () => {
    const { t, uploadFiles } = this.props;
    const { uri, name, type: pickerType } = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: false });

    if (pickerType === 'cancel') {
      return;
    }

    const type = mime.contentType(path.extname(name));
    if (type) {
      const imageData = new ReactNativeFile({ uri, name, type });
      await uploadFiles([imageData]);
    } else {
      this.setState({ notify: t('upload.errorMsg') });
    }
  };

  downloadFile = async (path, name) => {
    const { t } = this.props;
    const { albumName } = uploadConfig;
    const { getAlbumAsync, addAssetsToAlbumAsync, createAlbumAsync, createAssetAsync } = MediaLibrary;
    const { downloadAsync, deleteAsync, cacheDirectory } = FileSystem;
    if (await this.checkPermission(Permissions.CAMERA_ROLL)) {
      try {
        this.setState({ isDownload: true });
        const { uri } = await downloadAsync(serverUrl + '/' + path, cacheDirectory + name);
        const createAsset = await createAssetAsync(uri);

        // Remove file from cache directory
        await deleteAsync(uri);

        const album = await getAlbumAsync(albumName);
        album
          ? await addAssetsToAlbumAsync([createAsset], album, false)
          : await createAlbumAsync(albumName, createAsset, false);

        this.setState({ isDownload: false, notify: `${t('download.successMsg')}` });
      } catch (e) {
        this.setState({ notify: `${e}`, isDownloading: false });
      }
    } else {
      this.setState({ notify: t('download.errorMsg'), isDownload: false });
    }
  };

  checkPermission = async type => {
    const { getAsync, askAsync } = Permissions;
    const { status } = await getAsync(type);
    if (status !== 'granted') {
      const { status } = await askAsync(type);
      return status === 'granted';
    }
    return true;
  };

  render() {
    return (
      <UploadView
        {...this.props}
        handleRemoveFile={this.handleRemoveFile}
        handleUploadFile={this.handleUploadFile}
        downloadFile={this.downloadFile}
        notify={this.state.notify}
        onBackgroundPress={() => this.setState({ notify: null })}
      />
    );
  }
}