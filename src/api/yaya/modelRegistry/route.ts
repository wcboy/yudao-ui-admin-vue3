import request from '@/config/axios'

export interface YayaModelRouteVO {
  id?: number
  logicalName?: string
  orderedEndpointIds?: number[]
  strategy?: string
  status?: string
  remark?: string
  updateTime?: Date | string
}

export const YayaModelRouteApi = {
  getRouteList: async () => {
    return await request.get<YayaModelRouteVO[]>({ url: '/yaya/model-route/list' })
  },

  createRoute: async (data: YayaModelRouteVO) => {
    return await request.post<number>({ url: '/yaya/model-route/create', data })
  },

  updateRoute: async (data: YayaModelRouteVO) => {
    return await request.put<boolean>({ url: '/yaya/model-route/update', data })
  },

  deleteRoute: async (id: number) => {
    return await request.delete<boolean>({ url: '/yaya/model-route/delete', params: { id } })
  }
}
