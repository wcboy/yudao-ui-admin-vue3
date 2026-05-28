import request from '@/config/axios'

export interface YayaImportResultVO {
  seasonKey: string
  topics: number
  questions: number
  errors: string[]
}

export const YayaImportApi = {
  previewImport: async (season: string) => {
    return await request.post<YayaImportResultVO>({
      url: `/yaya/import-batches/${season}:preview`
    })
  },

  runImport: async (season: string) => {
    return await request.post<YayaImportResultVO>({
      url: `/yaya/import-batches/${season}:run`
    })
  }
}
