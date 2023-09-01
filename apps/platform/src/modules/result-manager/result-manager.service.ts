import { message } from 'antd';

import { listResults } from '@/services/secretpad/NodeController';
import { Model } from '@/util/valtio-helper';

import type { TableType } from './result-manager.protocol';

type TableTypeMapper = {
  [key in TableType]: string;
};

export const TableTypeMap: TableTypeMapper = {
  table: '表',
  report: '报告',
  rule: '规则',
  model: '模型',
};

export class ResultManagerService extends Model {
  download = async (nodeId: string, tableInfo: API.NodeResultsVO) => {
    message.info('开始下载,请稍等...');
    fetch(`/api/v1alpha1/data/download`, {
      method: 'POST',
      mode: 'cors',
      cache: 'no-cache',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        nodeId,
        domainDataId: tableInfo.domainDataId,
      }),
    }).then((res) =>
      res.blob().then((blob) => {
        const disposition = res.headers.get('Content-Disposition');
        let filename = '';
        const filenameRegex = /filename[^;=\n]*=[^'"]*['"]*((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition || '');
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
        const a = document.createElement('a');
        document.body.appendChild(a); //兼容火狐，将a标签添加到body当中
        const url = window.URL.createObjectURL(blob); // 获取 blob 本地文件连接 (blob 为纯二进制对象，不能够直接保存到磁盘上)
        a.href = url;
        a.download = filename;
        a.click();
        a.remove(); //移除a标签
        window.URL.revokeObjectURL(url);
        message.success('下载完成');
      }),
    );
  };

  async getResultList(
    nodeId: string,
    pageNumber: number,
    pageSize: number,
    search: string,
    types: string[],
    sortRule: string,
  ) {
    const result = await listResults({
      nodeId,
      pageNumber,
      pageSize,
      nameFilter: search,
      kindFilters: types,
      timeSortingRule: sortRule,
    });
    return result.data;
  }
}
