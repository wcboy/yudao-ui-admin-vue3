import request from '@/config/axios'

export interface YayaMemberPlanVO {
  id?: number
  planKey?: string
  name?: string
  description?: string
  priceCent?: number
  currency?: string
  durationDays?: number
  active?: number
  benefits?: Record<string, any>
}

export const YayaMemberPlanApi = {
  getPlanList: async () => {
    return await request.get<YayaMemberPlanVO[]>({ url: '/yaya/member-plans' })
  },

  createPlan: async (data: YayaMemberPlanVO) => {
    return await request.post<number>({ url: '/yaya/member-plans', data })
  },

  updatePlan: async (id: number, data: YayaMemberPlanVO) => {
    return await request.patch<boolean>({ url: `/yaya/member-plans/${id}`, data })
  },

  updatePlanStatus: async (id: number, active: number) => {
    return await request.patch<boolean>({
      url: `/yaya/member-plans/${id}/status`,
      data: { active }
    })
  }
}
