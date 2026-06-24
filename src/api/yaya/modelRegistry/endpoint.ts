import request from '@/config/axios'

export interface YayaModelEndpointVO {
  id?: number
  code?: string
  name?: string
  category?: string
  protocol?: string
  baseUrl?: string
  apiKey?: string
  apiKeyMasked?: string
  extra?: Record<string, any>
  status?: string
  health?: string
  lastError?: string
  checkedAt?: Date | string
  remark?: string
  updateTime?: Date | string
}

export interface YayaModelEndpointPageReqVO extends PageParam {
  category?: string
  status?: string
  keyword?: string
}

export const YayaModelEndpointApi = {
  getEndpointPage: async (params: YayaModelEndpointPageReqVO) => {
    return await request.get({ url: '/yaya/model-endpoint/page', params })
  },

  getEndpoint: async (id: number) => {
    return await request.get<YayaModelEndpointVO>({ url: '/yaya/model-endpoint/get', params: { id } })
  },

  createEndpoint: async (data: YayaModelEndpointVO) => {
    return await request.post<number>({ url: '/yaya/model-endpoint/create', data })
  },

  updateEndpoint: async (data: YayaModelEndpointVO) => {
    return await request.put<boolean>({ url: '/yaya/model-endpoint/update', data })
  },

  deleteEndpoint: async (id: number) => {
    return await request.delete<boolean>({ url: '/yaya/model-endpoint/delete', params: { id } })
  }
}
