import { Container } from 'unstated';

import loggerFactory from '@alias/logger';

// eslint-disable-next-line no-unused-vars
const logger = loggerFactory('growi:services:PersonalContainer');

/**
 * Service container for personal settings page (PersonalSettings.jsx)
 * @extends {Container} unstated Container
 */
export default class PersonalContainer extends Container {

  constructor(appContainer) {
    super();

    this.appContainer = appContainer;

    this.state = {
      retrieveError: null,
      name: '',
      email: '',
      registrationWhiteList: this.appContainer.getConfig().registrationWhiteList,
      isEmailPublished: false,
      lang: 'en-US',
      isGravatarEnabled: false,
      croppedImageUrl: '',
      externalAccounts: [],
      isPasswordSet: false,
      apiToken: '',
    };

  }

  /**
   * Workaround for the mangling in production build to break constructor.name
   */
  static getClassName() {
    return 'PersonalContainer';
  }

  /**
   * retrieve personal data
   */
  async retrievePersonalData() {
    try {
      const response = await this.appContainer.apiv3.get('/personal-setting/');
      const { currentUser } = response.data;
      const croppedImageUrl = this.getUploadedPictureSrc(currentUser);
      this.setState({
        name: currentUser.name,
        email: currentUser.email,
        isEmailPublished: currentUser.isEmailPublished,
        lang: currentUser.lang,
        isGravatarEnabled: currentUser.isGravatarEnabled,
        isPasswordSet: (currentUser.password != null),
        apiToken: currentUser.apiToken,
        croppedImageUrl,
      });
    }
    catch (err) {
      this.setState({ retrieveError: err });
      logger.error(err);
      throw new Error('Failed to fetch personal data');
    }
  }

  /**
   * define a function for uploaded picture
   */
  getUploadedPictureSrc(user) {
    if (user.image) {
      return user.image;
    }
    if (user.imageAttachment != null) {
      return user.imageAttachment.filePathProxied;
    }

    return '/images/icons/user.svg';
  }

  /**
   * retrieve external accounts that linked me
   */
  async retrieveExternalAccounts() {
    try {
      const response = await this.appContainer.apiv3.get('/personal-setting/external-accounts');
      const { externalAccounts } = response.data;

      this.setState({ externalAccounts });
    }
    catch (err) {
      this.setState({ retrieveError: err });
      logger.error(err);
      throw new Error('Failed to fetch external accounts');
    }
  }

  /**
   * Change name
   */
  changeName(inputValue) {
    this.setState({ name: inputValue });
  }

  /**
   * Change email
   */
  changeEmail(inputValue) {
    this.setState({ email: inputValue });
  }

  /**
   * Change isEmailPublished
   */
  changeIsEmailPublished(boolean) {
    this.setState({ isEmailPublished: boolean });
  }

  /**
   * Change lang
   */
  changeLang(lang) {
    this.setState({ lang });
  }

  /**
   * Change isGravatarEnabled
   */
  changeIsGravatarEnabled(boolean) {
    this.setState({ isGravatarEnabled: boolean });
  }

  /**
   * Update basic info
   * @memberOf PersonalContainer
   * @return {Array} basic info
   */
  async updateBasicInfo() {
    try {
      const response = await this.appContainer.apiv3.put('/personal-setting/', {
        name: this.state.name,
        email: this.state.email,
        isEmailPublished: this.state.isEmailPublished,
        lang: this.state.lang,
      });
      const { updatedUser } = response.data;

      this.setState({
        name: updatedUser.name,
        email: updatedUser.email,
        isEmailPublished: updatedUser.isEmailPublished,
        lang: updatedUser.lang,
      });
    }
    catch (err) {
      this.setState({ retrieveError: err });
      logger.error(err);
      throw new Error('Failed to update personal data');
    }
  }

  /**
   * Update profile image
   * @memberOf PersonalContainer
   */
  async updateProfileImage() {
    try {
      const response = await this.appContainer.apiv3.put('/personal-setting/image-type', {
        isGravatarEnabled: this.state.isGravatarEnabled,
      });
      const { userData } = response.data;
      this.setState({
        isGravatarEnabled: userData.isGravatarEnabled,
      });
    }
    catch (err) {
      this.setState({ retrieveError: err });
      logger.error(err);
      throw new Error('Failed to update profile image');
    }
  }

  /**
   * Upload image
   */
  async uploadAttachment(file) {

    try {
      // TODO create apiV3
      // await this.appContainer.apiPost('/attachments.uploadProfileImage', { data: formData });
    }
    catch (err) {
      this.setState({ retrieveError: err });
      logger.error(err);
      throw new Error('Failed to upload profile image');
    }
  }

}
