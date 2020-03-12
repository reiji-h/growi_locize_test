import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';

import PaginationWrapper from '../PaginationWrapper';


import { createSubscribedElement } from '../UnstatedUtils';
import { toastError } from '../../util/apiNotification';

import AppContainer from '../../services/AppContainer';
import AdminUsersContainer from '../../services/AdminUsersContainer';

import PasswordResetModal from './Users/PasswordResetModal';
import InviteUserControl from './Users/InviteUserControl';
import UserTable from './Users/UserTable';

class UserManagement extends React.Component {

  constructor(props) {
    super();
    this.handlePage = this.handlePage.bind(this);
    this.handleChangeSearchText = this.handleChangeSearchText.bind(this);
  }

  componentWillMount() {
    this.handlePage(1);
  }

  // ----- page loading -----
  async handlePage(selectedPage) {
    try {
      await this.props.adminUsersContainer.retrieveUsersByPagingNum(selectedPage);
    }
    catch (err) {
      toastError(err);
    }
  }

  // ----- User Status Check box -----
  handleClick(statusType) {
    const { adminUsersContainer } = this.props;
    if (!this.validateToggleStatus(statusType)) {
      adminUsersContainer.setNotifyComment('You should check at least one checkbox.');
      return;
    }

    if (adminUsersContainer.state.notifyComment.length > 0) {
      adminUsersContainer.setNotifyComment('');
    }
    adminUsersContainer.handleClick(statusType);
  }

  validateToggleStatus(statusType) {
    if (this.props.adminUsersContainer.isSelected(statusType)) {
      // if else status is selected, then true
      return this.props.adminUsersContainer.state.selectedStatusList.size > 1;
    }
    return true;
  }

  // ----- Search Input -----
  handleChangeSearchText(event) {
    this.props.adminUsersContainer.handleChangeSearchText(event.target.value);
  }

  render() {
    const { t, adminUsersContainer } = this.props;

    const pager = (
      <div className="pull-right">
        <PaginationWrapper
          activePage={adminUsersContainer.state.activePage}
          changePage={this.handlePage}
          totalItemsCount={adminUsersContainer.state.totalUsers}
          pagingLimit={adminUsersContainer.state.pagingLimit}
        />
      </div>
    );

    const notifyComment = (adminUsersContainer.state.notifyComment && <span className="text-warning">{ adminUsersContainer.state.notifyComment }</span>);

    const clearButton = (
      adminUsersContainer.state.searchText.length > 0
        ? (
          <i
            className="icon-close search-clear"
            onClick={() => {
              adminUsersContainer.clearSearchText();
              this.searchUserElement.value = '';
            }}
          />
        )
        : ''
    );

    return (
      <Fragment>
        {adminUsersContainer.state.userForPasswordResetModal && <PasswordResetModal />}
        <p>
          <InviteUserControl />
          <a className="btn btn-default btn-outline ml-2" href="/admin/users/external-accounts">
            <i className="icon-user-follow" aria-hidden="true"></i>
            {t('admin:user_management.external_account')}
          </a>
        </p>

        <h2>{t('User_Management')}</h2>

        <div className="border-top border-bottom">

          <div className="d-flex justify-content-start align-items-center my-2">
            <div>
              <i className="icon-magnifier mr-1"></i>
              <span className="search-typeahead">
                <input
                  type="text"
                  ref={(searchUserElement) => { this.searchUserElement = searchUserElement }}
                  onChange={this.handleChangeSearchText}
                />
                { clearButton }
              </span>
            </div>

            <div className="mx-5">
              <input
                type="checkbox"
                id="c1"
                className="mr-1"
                checked={adminUsersContainer.isSelected('All')}
                onClick={() => { this.handleClick('All') }}
              />
              <label htmlFor="c1" className="mr-2">All</label>

              <input
                type="checkbox"
                id="c2"
                className="mr-1"
                checked={adminUsersContainer.isSelected('registered')}
                onClick={() => { this.handleClick('registered') }}
              />
              <label htmlFor="c2" className="label label-info mr-2">Approval Pending</label>

              <input
                type="checkbox"
                id="c3"
                className="mr-1"
                checked={adminUsersContainer.isSelected('active')}
                onClick={() => { this.handleClick('active') }}
              />
              <label htmlFor="c3" className="label label-success mr-2">Active</label>

              <input
                type="checkbox"
                id="c4"
                className="mr-1"
                checked={adminUsersContainer.isSelected('suspended')}
                onClick={() => { this.handleClick('suspended') }}
              />
              <label htmlFor="c4" className="label label-warning mr-2">Suspended</label>

              <input
                type="checkbox"
                id="c5"
                className="mr-1"
                checked={adminUsersContainer.isSelected('invited')}
                onClick={() => { this.handleClick('invited') }}
              />
              <label htmlFor="c5" className="label label-info">Invited</label>
            </div>

            <div>
              <button type="button" className="btn btn-default btn-outline btn-sm">
                <span className="icon-refresh mr-1"></span>
                Reset
              </button>
            </div>

            <div className="ml-5">{ notifyComment }</div>

          </div>
        </div>


        {pager}
        <UserTable />
        {pager}

      </Fragment>
    );
  }

}


UserManagement.propTypes = {
  t: PropTypes.func.isRequired, // i18next
  appContainer: PropTypes.instanceOf(AppContainer).isRequired,
  adminUsersContainer: PropTypes.instanceOf(AdminUsersContainer).isRequired,
};

const UserManagementWrapper = (props) => {
  return createSubscribedElement(UserManagement, props, [AppContainer, AdminUsersContainer]);
};

export default withTranslation()(UserManagementWrapper);
