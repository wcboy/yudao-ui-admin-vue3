import request from '@/config/axios'

export interface YayaQuestionVO {
  id?: number
  topicId?: number
  legacyUuid?: string
  questionRole?: string
  promptEn?: string
  promptZh?: string
  cueBullets?: any[]
  displayOrder?: number
  prepareSeconds?: number
  answerSeconds?: number
  metadata?: Record<string, any>
}

export interface YayaTopicVO {
  id?: number
  legacyUuid?: string
  seasonId?: number
  sourceSnapshotId?: number
  part?: number
  stableKey?: string
  topicNo?: number
  titleEn?: string
  titleZh?: string
  topicType?: string
  category?: string
  promptEn?: string
  promptZh?: string
  displayOrder?: number
  reviewStatus?: string
  publishStatus?: string
  metadata?: Record<string, any>
  updateTime?: Date | string
  questions?: YayaQuestionVO[]
}

export interface YayaTopicPageReqVO extends PageParam {
  seasonKey?: string
  part?: number
  publishStatus?: string
  keyword?: string
}

export const YayaTopicApi = {
  getTopicPage: async (params: YayaTopicPageReqVO) => {
    return await request.get({ url: '/yaya/topics', params })
  },

  getTopic: async (id: number) => {
    return await request.get<YayaTopicVO>({ url: `/yaya/topics/${id}` })
  },

  createTopic: async (data: YayaTopicVO) => {
    return await request.post<number>({ url: '/yaya/topics', data })
  },

  updateTopic: async (id: number, data: YayaTopicVO) => {
    return await request.patch<boolean>({ url: `/yaya/topics/${id}`, data })
  },

  replaceQuestions: async (id: number, data: { questions: YayaQuestionVO[] }) => {
    return await request.put<boolean>({ url: `/yaya/topics/${id}/questions`, data })
  },

  updatePublishStatus: async (id: number, data: { publishStatus: string }) => {
    return await request.patch<boolean>({ url: `/yaya/topics/${id}/publish-status`, data })
  }
}
