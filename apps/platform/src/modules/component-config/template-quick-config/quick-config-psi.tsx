import { PlusCircleFilled, DeleteOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import { Form, Select, Tag } from 'antd';
import { parse } from 'query-string';
import type { Dispatch, SetStateAction } from 'react';
import { useState, useEffect } from 'react';
import { useLocation } from 'umi';

import {
  getProject,
  getProjectDatatable,
} from '@/services/secretpad/ProjectController';

import styles from './index.less';

const { Option } = Select;

type QuickConfigPSIComponentProps = {
  tables: { datatableId: string; nodeName: string; datatableName: string }[];
  tableList: (API.ProjectDatatableBaseVO & {
    nodeId: string | undefined;
    nodeName: string | undefined;
  })[];

  form: FormInstance;
};

export const QuickConfigPSIComponent = (props: QuickConfigPSIComponentProps) => {
  const { tables, tableList, form } = props;

  const { s: selectedReceiver } = Form.useWatch('dataTableReceiver', form) || {};
  const { s: selectedSender } = Form.useWatch('dataTableSender', form) || {};
  const [receiverCols, setReceiverCols] = useState<{ value: string; label: string }[]>(
    [],
  );
  const [senderCols, setSenderCols] = useState<{ value: string; label: string }[]>([]);
  const { search } = useLocation();
  const { projectId } = parse(search) as { projectId: string };

  const getCols = async (
    selectedTable: string,
    callback: Dispatch<SetStateAction<{ value: string; label: string }[]>>,
  ) => {
    const table = tableList.find((d) => d.datatableId === selectedTable);
    if (!table) return;
    const { data: tableConfig } = await getProjectDatatable({
      projectId,
      nodeId: table.nodeId,
      datatableId: table.datatableId,
    });
    if (!tableConfig) return;
    const { configs } = tableConfig;

    if (configs) {
      callback(
        configs.map(({ colName }: { colName: string }) => ({
          value: colName,
          label: colName,
        })),
      );
    }
  };

  useEffect(() => {
    getCols(selectedReceiver, setReceiverCols);
  }, [selectedReceiver, projectId]);

  useEffect(() => {
    getCols(selectedSender, setSenderCols);
  }, [selectedSender, projectId]);

  return (
    <>
      <Form.Item
        label={<div className={styles.configItemLabel}>样本表1</div>}
        name={'dataTableReceiver'}
        messageVariables={{ label: '样本表' }}
        rules={[
          {
            required: true,
          },
        ]}
        valuePropName="value"
        colon={false}
        getValueProps={(value) => {
          return { value: value?.s };
        }}
        getValueFromEvent={(value) => {
          return { s: value };
        }}
      >
        <Select optionLabelProp="label">
          {tables.map((table) => (
            <Option
              key={table.datatableId}
              value={table.datatableId}
              label={table.datatableName}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                {table.datatableName}
                <Tag>{table.nodeName}</Tag>
              </div>
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.List name={['receiverKey', 'ss']} initialValue={[undefined]}>
        {(fields, { add, remove }, { errors }) =>
          fields.map((field, index) => (
            <div className={styles.selectionItem} key={index}>
              <div className={styles.selectionItemInput}>
                <Form.Item
                  {...field}
                  required={index === 0}
                  label={
                    <div className={styles.configItemLabel}>关联键{index + 1}</div>
                  }
                  rules={[
                    {
                      validator: async (_, col) => {
                        if (!col && index === 0)
                          return Promise.reject(new Error(`至少选择1列作为关联键`));

                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <Select options={receiverCols} />
                </Form.Item>
                <Form.ErrorList errors={errors} />
              </div>
              <div className={styles.selectionItemIcon}>
                {index === 0 ? (
                  <PlusCircleFilled onClick={() => add()} />
                ) : (
                  <DeleteOutlined onClick={() => remove(index)} />
                )}
              </div>
            </div>
          ))
        }
      </Form.List>

      <Form.Item
        label={<div className={styles.configItemLabel}>样本表2</div>}
        name={'dataTableSender'}
        messageVariables={{ label: '样本表' }}
        rules={[
          {
            required: true,
            validator: (_, val) => {
              if (val?.s === selectedReceiver)
                return Promise.reject(new Error('不能选择同一份样本表'));

              return Promise.resolve();
            },
          },
        ]}
        colon={false}
        valuePropName="value"
        getValueProps={(value) => {
          return { value: value?.s };
        }}
        getValueFromEvent={(value) => {
          return { s: value };
        }}
      >
        <Select optionLabelProp="label">
          {tables.map((table) => (
            <Option
              key={table.datatableId}
              value={table.datatableId}
              label={table.datatableName}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                {table.datatableName}
                <Tag>{table.nodeName}</Tag>
              </div>
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.List name={['senderKey', 'ss']} initialValue={[undefined]}>
        {(fields, { add, remove }, { errors }) =>
          fields.map((field, index) => (
            <div className={styles.selectionItem} key={index}>
              <div className={styles.selectionItemInput}>
                <Form.Item
                  {...field}
                  required={index === 0}
                  label={
                    <div className={styles.configItemLabel}>关联键{index + 1}</div>
                  }
                  valuePropName="value"
                  rules={[
                    {
                      validator: async (_, col) => {
                        if (!col && index === 0)
                          return Promise.reject(new Error(`至少选择1列作为关联键`));
                        if (!col)
                          return Promise.reject(new Error(`关联键为空，请删除`));

                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <Select options={senderCols} />
                </Form.Item>
                <Form.ErrorList errors={errors} />
              </div>
              <div className={styles.selectionItemIcon}>
                {index === 0 ? (
                  <PlusCircleFilled onClick={() => add()} />
                ) : (
                  <DeleteOutlined onClick={() => remove(index)} />
                )}
              </div>
            </div>
          ))
        }
      </Form.List>
    </>
  );
};

export const QuickConfigPSI = () => {
  const form = Form.useFormInstance();
  const [tables, setTables] = useState<
    { datatableId: string; nodeName: string; datatableName: string }[]
  >([]);
  const [tableList, setTableList] = useState<
    (API.ProjectDatatableBaseVO & {
      nodeId: string | undefined;
      nodeName: string | undefined;
    })[]
  >([]);

  const { search } = useLocation();
  const { projectId } = parse(search) as { projectId: string };

  useEffect(() => {
    const getTables = async () => {
      const dataTableOptions: {
        datatableId: string;
        nodeName: string;
        datatableName: string;
      }[] = [];
      const dataTableList: (API.ProjectDatatableBaseVO & {
        nodeId: string | undefined;
        nodeName: string | undefined;
      })[] = [];
      const { data } = await getProject({ projectId });
      if (!data) return;
      const { nodes } = data;
      if (!nodes) return;

      nodes.map((node) => {
        const { datatables, nodeId, nodeName } = node;

        if (!datatables) return;
        datatables.map((table) => {
          dataTableList.push({ ...table, nodeId, nodeName });
          if (table.datatableId && table.datatableName)
            dataTableOptions.push({
              datatableId: table.datatableId,
              nodeName: nodeName as string,
              datatableName: table.datatableName,
            });
        });
      });

      setTables(dataTableOptions);
      setTableList(dataTableList);
    };

    getTables();
  }, [projectId]);

  return <QuickConfigPSIComponent tables={tables} tableList={tableList} form={form} />;
};
