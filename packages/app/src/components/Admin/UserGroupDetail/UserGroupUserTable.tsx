import React, { useEffect, useCallback, useMemo } from 'react';

import { UserPicture } from '@growi/ui';
import dateFnsFormat from 'date-fns/format';
import { useTranslation } from 'next-i18next';


import AdminUserGroupDetailContainer from '~/client/services/AdminUserGroupDetailContainer';
import { toastSuccess, toastError } from '~/client/util/apiNotification';
import { IUserGroupHasId, IUserGroupRelation } from '~/interfaces/user';
import Xss from '~/services/xss';
import { useSWRxUserGroupRelations } from '~/stores/user-group';

import { withUnstatedContainers } from '../../UnstatedUtils';

type Props = {
  adminUserGroupDetailContainer: AdminUserGroupDetailContainer
  userGroupRelations: IUserGroupRelation[],
  userGroup: IUserGroupHasId,
  onClickRemoveUserBtn: (username: string) => void,
}

const UserGroupUserTable = (props: Props) => {
  const { t } = useTranslation();

  const { adminUserGroupDetailContainer, userGroup, onClickRemoveUserBtn } = props;
  const { data: userGroupRelations } = useSWRxUserGroupRelations(userGroup._id);
  const xss = useMemo(() => new Xss(), []);

  const removeUser = useCallback(async(username: string) => {
    try {
      // await props.adminUserGroupDetailContainer.removeUserByUsername(username);
      await onClickRemoveUserBtn(username);
      // toastSuccess(`Removed "${xss.process(username)}" from "${xss.process(props.adminUserGroupDetailContainer.state.userGroup.name)}"`);
      toastSuccess(`Removed "${xss.process(username)}" from "${xss.process(userGroup.name)}"`);
    }
    catch (err) {
      // eslint-disable-next-line max-len
      // toastError(new Error(`Unable to remove "${xss.process(username)}" from "${xss.process(props.adminUserGroupDetailContainer.state.userGroup.name)}"`));
      toastError(new Error(`Unable to remove "${xss.process(username)}" from "${xss.process(userGroup.name)}"`));
    }
  }, [onClickRemoveUserBtn, userGroup.name, xss]);


  return (
    <table className="table table-bordered table-user-list">
      <thead>
        <tr>
          <th style={{ width: '100px' }}>#</th>
          <th>
            {t('username')}
          </th>
          <th>{t('Name')}</th>
          <th style={{ width: '100px' }}>{t('Created')}</th>
          <th style={{ width: '160px' }}>{t('Last_Login')}</th>
          <th style={{ width: '70px' }}></th>
        </tr>
      </thead>
      <tbody>
        {userGroupRelations != null && userGroupRelations.map((relation) => {
          const { relatedUser } = relation;

          return (
            <tr key={relation._id}>
              <td>
                <UserPicture user={relatedUser} className="picture rounded-circle" />
              </td>
              <td>
                <strong>{relatedUser.username}</strong>
              </td>
              <td>{relatedUser.name}</td>
              <td>{relatedUser.createdAt ? dateFnsFormat(new Date(relatedUser.createdAt), 'yyyy-MM-dd') : ''}</td>
              <td>{relatedUser.lastLoginAt ? dateFnsFormat(new Date(relatedUser.lastLoginAt), 'yyyy-MM-dd HH:mm:ss') : ''}</td>
              <td>
                <div className="btn-group admin-user-menu">
                  <button
                    type="button"
                    id={`admin-group-menu-button-${relatedUser._id}`}
                    className="btn btn-outline-secondary btn-sm dropdown-toggle"
                    data-toggle="dropdown"
                  >
                    <i className="icon-settings"></i>
                  </button>
                  <div className="dropdown-menu" role="menu" aria-labelledby={`admin-group-menu-button-${relatedUser._id}`}>
                    <button
                      className="dropdown-item"
                      type="button"
                      onClick={() => {
                        return removeUser(relatedUser.username);
                      }}
                    >
                      <i className="icon-fw icon-user-unfollow"></i> {t('admin:user_group_management.remove_from_group')}
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          );
        })}

        <tr>
          <td></td>
          <td className="text-center">
            <button className="btn btn-outline-secondary" type="button" onClick={adminUserGroupDetailContainer.openUserGroupUserModal}>
              <i className="ti ti-plus"></i>
            </button>
          </td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </tr>

      </tbody>
    </table>
  );
};

/**
 * Wrapper component for using unstated
 */
const UserGroupUserTableWrapper = withUnstatedContainers(UserGroupUserTable, [AdminUserGroupDetailContainer]);

export default UserGroupUserTableWrapper;
