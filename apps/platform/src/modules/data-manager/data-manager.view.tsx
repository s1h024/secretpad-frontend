import { SearchOutlined, InfoCircleOutlined } from '@ant-design/icons';
import type { RadioChangeEvent, TourProps } from 'antd';
import { message, Tag } from 'antd';
import {
  Button,
  Radio,
  Input,
  Tour,
  Table,
  Space,
  Popover,
  Badge,
  Typography,
  Tooltip,
  Empty,
} from 'antd';
import type { MessageInstance } from 'antd/es/message/interface';
import { parse } from 'query-string';
import type { ChangeEvent } from 'react';
import React, { useEffect, useRef } from 'react';

import { confirmDelete } from '@/components/comfirm-delete';
import { EdgeAuthWrapper } from '@/components/edge-wrapper-auth';
import { Platform, hasAccess } from '@/components/platform-wrapper';
import { DataTableAddContent } from '@/modules/data-table-add/data-table-add.view';
import { DatatableInfoService } from '@/modules/data-table-info/component/data-table-auth/data-table-auth.service';
import { DataTableAuth } from '@/modules/data-table-info/data-table-auth-drawer';
import { DataTableInfoDrawer } from '@/modules/data-table-info/data-table-info.view';
import {
  GuideTourKeys,
  GuideTourService,
} from '@/modules/guide-tour/guide-tour-service';
import { NodeService } from '@/modules/node';
import {
  deleteDatatable,
  pushDatatableToTeeNode,
} from '@/services/secretpad/DatatableController';
import { getModel, Model, useModel } from '@/util/valtio-helper';

import { LoginService } from '../login/login.service';

import { DataManagerService, UploadStatus } from './data-manager.service';
import styles from './index.less';

const embeddedSheets = ['alice.csv', 'bob.csv'];

export const DataManagerComponent: React.FC = () => {
  const viewInstance = useModel(DataManagerView);
  const guideTourService = useModel(GuideTourService);
  const loginService = useModel(LoginService);
  const [messageApi, contextHolder] = message.useMessage();
  const ref1 = useRef(null);
  const steps: TourProps['steps'] = [
    {
      title: '在这里可以把节点数据授权到项目哦',
      description: '',
      nextButtonProps: {
        children: <div>知道了</div>,
      },
      target: () => ref1.current,
    },
  ];

  const columns = [
    {
      title: '数据表名',
      dataIndex: 'datatableName',
      key: 'datatableName',
      ellipsis: true,
      width: '20%',
      render: (text: string, tableInfo: API.DatatableVO) => (
        <Tooltip title={text}>
          <a onClick={() => viewInstance.openDataInfo(tableInfo)}>{text}</a>
        </Tooltip>
      ),
    },
    {
      title: '表类型',
      dataIndex: 'type',
      key: 'type',
      width: '10%',
      // filters: [
      //   { text: '表', value: 'table' },
      //   { text: '模型', value: 'model' },
      //   { text: '规则', value: 'rule' },
      // ],
    },
    {
      title: '已授权项目',
      dataIndex: 'authProjects',
      key: 'authProjects',
      render: (authProjects: API.AuthProjectVO[]) => {
        const authProjectsFixed = authProjects || [];
        return (
          <div style={{ display: 'flex' }}>
            {(authProjectsFixed || [])
              .slice(0, 2)
              .map((i) => i.name)
              .join('、')}
            {authProjectsFixed.length ? ',' : ''}共
            <Popover
              placement="right"
              title="已授权项目"
              content={
                <div className={styles.authProjectListPopover}>
                  {(() => {
                    const projects = authProjectsFixed.map((i) => (
                      <div key={i.name} className={styles.authProjectListPopoverItem}>
                        {i.name}
                      </div>
                    ));
                    return projects.length > 0 ? (
                      projects
                    ) : (
                      <Empty description={false} image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    );
                  })()}
                </div>
              }
              trigger="hover"
            >
              <a>{authProjectsFixed.length}</a>
            </Popover>
            个项目
          </div>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: '10%',
      render: (status: string) => {
        if (status == 'Available') {
          return (
            <Space>
              <Badge key="green" color="green" text="" />
              可用
            </Space>
          );
        } else {
          return (
            <Space>
              <Badge key="red" color="red" text="" />
              不可用
            </Space>
          );
        }
      },
    },
    {
      title: (
        <div className={styles.uploadTitle}>
          <div className={styles.uploadText}>加密上传</div>
          <Tooltip title="加密上传到TEE，若数据表内容修改可重新上传">
            <InfoCircleOutlined className={styles.uploadIcon} />
          </Tooltip>
        </div>
      ),
      key: 'pushToTeeStatus',
      dataIndex: 'pushToTeeStatus',
      width: '15%',
      render: (status: string, record: API.DatatableVO) => {
        if (!status || status === '') {
          return (
            <Button
              type="link"
              className={styles.uploadBtn}
              onClick={() => viewInstance.encryptedUpload(record)}
            >
              上传
            </Button>
          );
        } else if (status === UploadStatus.RUNNING) {
          return <div className={styles.uploadLoading}>上传中...</div>;
        } else if (status === UploadStatus.SUCCESS) {
          return (
            <div className={styles.uploadTag}>
              <Tag color="success">成功</Tag>
              <Button type="link" onClick={() => viewInstance.encryptedUpload(record)}>
                重新上传
              </Button>
            </div>
          );
        } else if (status === UploadStatus.FAILED) {
          return (
            <div className={styles.uploadTag}>
              <Tooltip title={record.pushToTeeErrMsg}>
                <Tag color="error">失败</Tag>
              </Tooltip>
              <Button type="link" onClick={() => viewInstance.encryptedUpload(record)}>
                重新上传
              </Button>
            </div>
          );
        } else if (record.status !== 'Available') {
          return '-';
        }
      },
    },
    {
      title: '操作',
      key: 'action',
      width: '15%',
      render: (
        tableInfo: API.DatatableVO,
        tableInfo2: API.DatatableVO,
        index: number,
      ) => {
        const extendProps: any = {};
        if (index === 0) {
          extendProps['ref'] = ref1;
        }
        const authProjectsFixed = tableInfo.authProjects || [];
        return (
          <Space>
            <Typography.Link
              {...extendProps}
              onClick={() => viewInstance.openAuth(tableInfo)}
            >
              {'授权管理'}
            </Typography.Link>
            {!embeddedSheets.includes(tableInfo.datatableName || '') && (
              <Tooltip
                title={
                  authProjectsFixed.length > 0 ? '已授权到项目中的数据无法删除' : ''
                }
              >
                <Button
                  type="link"
                  disabled={authProjectsFixed.length > 0}
                  onClick={() => handleDelete(tableInfo)}
                >
                  删除
                </Button>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ];

  const handleDelete = (record: API.DatatableVO) => {
    confirmDelete({
      name: record.datatableName || '',
      description: '',
      onOk: () => {
        viewInstance.deleteData(
          record.datatableName || '',
          record.datatableId || '',
          messageApi,
        );
      },
    });
  };

  useEffect(() => {
    const flag = viewInstance.tablesList.filter(
      (item) => item.pushToTeeStatus === UploadStatus.RUNNING,
    );

    if (flag.length) {
      clearTimeout(viewInstance.tableListTimeOut);
      viewInstance.tableListTimeOut = setTimeout(() => {
        viewInstance.getTableList('', true);
      }, 2000);
    } else {
      clearTimeout(viewInstance.tableListTimeOut);
    }
  }, [viewInstance.tablesList]);

  return (
    <div className={styles.main}>
      <div className={styles.toolbar}>
        <div style={{ marginRight: 12, width: 220 }}>
          <Input
            placeholder="搜索表名"
            onChange={(e) => viewInstance.searchTable(e)}
            suffix={
              <SearchOutlined
                style={{
                  color: '#aaa',
                }}
              />
            }
          />
        </div>
        <div style={{ flex: 1 }}>
          <Radio.Group defaultValue="all" onChange={(e) => viewInstance.dataFilter(e)}>
            <Radio.Button value="all">全部</Radio.Button>
            <Radio.Button value="Available">可用</Radio.Button>
            <Radio.Button value="UnAvailable">不可用</Radio.Button>
          </Radio.Group>
        </div>
        <div>
          <Button type="primary" onClick={() => viewInstance.addData()}>
            添加数据
          </Button>
        </div>
      </div>
      <div className={styles.content}>
        <Table
          dataSource={viewInstance.displayTableList}
          // tee节点 / MPC部署模式 / p2p部署模式 不展示加密上传
          columns={
            viewInstance.currentNode.nodeId === 'tee' ||
            loginService.userInfo?.deployMode === 'MPC' ||
            hasAccess({ type: [Platform.AUTONOMY] })
              ? columns.filter((item) => item.key !== 'pushToTeeStatus')
              : columns
          }
          loading={viewInstance.tableLoading}
          pagination={{
            total: viewInstance.totalNum || 1,
            current: viewInstance.pageNumber,
            pageSize: viewInstance.pageSize,
            showSizeChanger: true,
            onChange: (page, pageSize) => {
              viewInstance.pageNumber = page;
              viewInstance.pageSize = pageSize;
              viewInstance.getTableList();
            },
            size: 'default',
          }}
          rowKey={(record) => record.datatableId as string}
          size="small"
        />
      </div>
      {viewInstance.displayTableList.length > 0 && (
        <EdgeAuthWrapper>
          <Tour
            open={!guideTourService.DatatableAuthTour}
            onClose={() => viewInstance.closeGuideTour()}
            mask={false}
            type="primary"
            zIndex={100000000}
            steps={steps}
            placement="topRight"
            rootClassName="dataauth-tour"
          />
        </EdgeAuthWrapper>
      )}
      {viewInstance.showAuthDrawer && (
        <DataTableAuth
          close={() => {
            viewInstance.showAuthDrawer = false;
          }}
          visible={viewInstance.showAuthDrawer}
          data={viewInstance.tableInfo}
        />
      )}

      {viewInstance.showAddDataDrawer && (
        <DataTableAddContent
          onClose={() => {
            viewInstance.getTableList();
            viewInstance.showAddDataDrawer = false;
          }}
          visible={viewInstance.showAddDataDrawer}
        />
      )}

      {viewInstance.showDatatableInfoDrawer && (
        <DataTableInfoDrawer
          close={() => {
            viewInstance.showDatatableInfoDrawer = false;
          }}
          visible={viewInstance.showDatatableInfoDrawer}
          data={{
            tableInfo: viewInstance.tableInfo,
            node: viewInstance.nodeService.currentNode as API.NodeVO,
          }}
        />
      )}
      {contextHolder}
    </div>
  );
};

export class DataManagerView extends Model {
  tablesList: API.DatatableVO[] = [];

  displayTableList: API.DatatableVO[] = [];

  pageNumber = 1;

  pageSize = 10;

  totalNum = 1;

  statusFilter = '';

  search = '';

  tableLoading = false;

  typesFilter: string[] = [];

  searchDebounce: number | undefined = undefined;

  showAuthDrawer = false;

  tableInfo: API.DatatableVO = {};

  showAddDataDrawer = false;

  showDatatableInfoDrawer = false;

  currentNode: API.NodeVO = {};

  tableListTimeOut: NodeJS.Timeout | undefined;

  guideTourService = getModel(GuideTourService);
  dataManagerService = getModel(DataManagerService);
  nodeService = getModel(NodeService);
  datatableInfoService = getModel(DatatableInfoService);

  onViewMount() {
    if (this.nodeService.currentNode) {
      this.getTableList(this.nodeService.currentNode.nodeId as string);
      this.currentNode = this.nodeService.currentNode;
    }
    this.nodeService.eventEmitter.on((currentNode) => {
      this.getTableList(currentNode.nodeId);
      this.currentNode = currentNode;
    });
    this.datatableInfoService.eventEmitter.on(() => {
      this.getTableList();
    });
  }

  closeGuideTour() {
    this.guideTourService.finishTour(GuideTourKeys.DatatableAuthTour);
  }

  async getTableList(nodeIdParam?: string, isUpload?: boolean) {
    if (isUpload) {
      this.tableLoading = false;
    } else {
      this.tableLoading = true;
    }
    const nodeId = nodeIdParam || this.nodeService.currentNode?.nodeId;
    const listData = await this.dataManagerService.listDataTables(
      nodeId || '',
      this.pageNumber,
      this.pageSize,
      this.statusFilter,
      this.search,
    );

    this.tableLoading = false;
    this.totalNum = listData?.totalDatatableNums || 1;
    this.tablesList = listData?.datatableVOList || [];

    this.displayTableList = this.tablesList;
  }

  addData() {
    this.showAddDataDrawer = true;
  }

  openDataInfo(tableInfo: API.DatatableVO) {
    this.tableInfo = tableInfo;
    this.showDatatableInfoDrawer = true;
  }

  openAuth(tableInfo: API.DatatableVO) {
    this.showAuthDrawer = true;
    this.tableInfo = tableInfo;
  }

  deleteData = async (
    datatableName: string,
    dataId: string,
    messageApi: MessageInstance,
  ) => {
    if (!this.nodeService.currentNode?.nodeId) return;
    const { status } = await deleteDatatable({
      nodeId: this.nodeService.currentNode?.nodeId,
      datatableId: dataId,
    });
    if (status && status.code !== 0) {
      messageApi.error(status.msg);
      return;
    }
    messageApi.success(`「${datatableName}」删除成功！`);
    this.getTableList();
  };

  encryptedUpload = async (record: API.DatatableVO) => {
    const { datatableId } = record;

    const { search } = window.location;
    const { nodeId } = parse(search);

    try {
      const { status } = await pushDatatableToTeeNode({
        nodeId: nodeId as string,
        datatableId,
      });

      if (status?.code === 0) {
        this.getTableList('', true);
      } else {
        message.error(status?.msg || '操作失败');
      }
    } catch (e) {
      message.error((e as Error).message);
    }
  };

  dataFilter(e: RadioChangeEvent) {
    if (e.target.value === 'all') {
      this.statusFilter = '';
    } else if (e.target.value === 'Available') {
      this.statusFilter = 'Available';
    } else {
      this.statusFilter = 'UnAvailable';
    }
    this.getTableList('', true);
  }

  searchTable(e: ChangeEvent<HTMLInputElement>) {
    this.search = e.target.value;
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      this.getTableList();
    }, 300) as unknown as number;
  }
}
