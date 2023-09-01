/* eslint-disable */
// 该文件由 OneAPI 自动生成，请勿手动修改！
import request from 'umi-request';

/** Delete datable api
@param request delete datatable request
@return successful SecretPadResponse with null data
 POST /api/v1alpha1/datatable/delete */
export async function deleteDatatable(
  body?: API.DeleteDatatableRequest,
  options?: { [key: string]: any },
) {
  return request<API.SecretPadResponse>('/api/v1alpha1/datatable/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** Query datatable api
@param request get datatable request
@return successful SecretPadResponse with datatable view object
 POST /api/v1alpha1/datatable/get */
export async function getDatatable(
  body?: API.GetDatatableRequest,
  options?: { [key: string]: any },
) {
  return request<API.SecretPadResponse_DatatableVO_>('/api/v1alpha1/datatable/get', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** List datatable api
@param request list datatable request
@return successful SecretPadResponse with datatable list view object
 POST /api/v1alpha1/datatable/list */
export async function listDatatables(
  body?: API.ListDatatableRequest,
  options?: { [key: string]: any },
) {
  return request<API.SecretPadResponse_DatatableListVO_>(
    '/api/v1alpha1/datatable/list',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: body,
      ...(options || {}),
    },
  );
}
