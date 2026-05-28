<template>
  <ContentWrap>
    <el-form :inline="true" :model="form" class="-mb-15px" label-width="72px">
      <el-form-item label="Season">
        <el-input
          v-model="form.season"
          class="!w-220px"
          clearable
          placeholder="26Q1"
          @keyup.enter="handlePreview"
        />
      </el-form-item>
      <el-form-item>
        <el-button :loading="previewLoading" @click="handlePreview">
          <Icon icon="ep:view" class="mr-5px" /> Preview
        </el-button>
        <el-button
          type="primary"
          :loading="runLoading"
          @click="handleRun"
          v-hasPermi="['yaya:import:run']"
        >
          <Icon icon="ep:upload-filled" class="mr-5px" /> Run Import
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-empty v-if="!result" description="No import result yet" />
    <template v-else>
      <el-row :gutter="16">
        <el-col :span="8">
          <div class="text-14px text-gray-500">Season</div>
          <div class="mt-8px text-22px">{{ result.seasonKey || '-' }}</div>
        </el-col>
        <el-col :span="8">
          <el-statistic title="Topics" :value="result.topics || 0" />
        </el-col>
        <el-col :span="8">
          <el-statistic title="Questions" :value="result.questions || 0" />
        </el-col>
      </el-row>
      <el-divider />
      <el-table :data="errorRows" border>
        <el-table-column type="index" width="70" />
        <el-table-column label="Errors" prop="message" min-width="480" show-overflow-tooltip />
      </el-table>
    </template>
  </ContentWrap>
</template>

<script lang="ts" setup>
import * as YayaImportApi from '@/api/yaya/import'

defineOptions({ name: 'YayaImportBatch' })

const message = useMessage()

const form = reactive({
  season: '26Q1'
})
const previewLoading = ref(false)
const runLoading = ref(false)
const result = ref<YayaImportApi.YayaImportResultVO>()

const errorRows = computed(() => {
  return (result.value?.errors || []).map((item) => ({ message: item }))
})

const normalizeSeason = () => form.season.trim().toUpperCase()

const handlePreview = async () => {
  const season = normalizeSeason()
  if (!season) {
    message.warning('Season is required')
    return
  }
  previewLoading.value = true
  try {
    result.value = await YayaImportApi.YayaImportApi.previewImport(season)
  } finally {
    previewLoading.value = false
  }
}

const handleRun = async () => {
  const season = normalizeSeason()
  if (!season) {
    message.warning('Season is required')
    return
  }
  try {
    await message.confirm(`Run legacy content import for ${season}?`)
    runLoading.value = true
    result.value = await YayaImportApi.YayaImportApi.runImport(season)
    if (result.value.errors.length === 0) {
      message.success('Import completed')
    }
  } finally {
    runLoading.value = false
  }
}
</script>
