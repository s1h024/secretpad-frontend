import { Drawer } from 'antd';
import React from 'react';

import { DataTableAuthComponent } from './component/data-table-auth/data-table-auth.view';

export enum DataAuthDrawerArea {
  Auth = 'Auth',
}

interface IProps<T> {
  visible: boolean;
  close: () => void;
  data: T;
}

export const DataTableAuth: React.FC<IProps<API.DatatableVO>> = ({
  visible,
  close,
  data,
}) => {
  return (
    <Drawer
      title={<div>「{data.datatableName}」授权管理</div>}
      width={700}
      open={visible}
      onClose={close}
      closable={false}
    >
      <DataTableAuthComponent tableInfo={data} size="middle" />
    </Drawer>
  );
};
