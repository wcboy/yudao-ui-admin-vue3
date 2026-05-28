<template>
  <ContentWrap>
    <el-form
      ref="queryFormRef"
      class="-mb-15px"
      :inline="true"
      :model="queryParams"
      label-width="88px"
    >
      <el-form-item label="Season" prop="seasonKey">
        <el-input
          v-model="queryParams.seasonKey"
          class="!w-180px"
          clearable
          placeholder="26Q1"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="Part" prop="part">
        <el-select v-model="queryParams.part" class="!w-140px" clearable placeholder="All">
          <el-option label="Part 1" :value="1" />
          <el-option label="Part 2" :value="2" />
          <el-option label="Part 3" :value="3" />
        </el-select>
      </el-form-item>
      <el-form-item label="Status" prop="publishStatus">
        <el-select v-model="queryParams.publishStatus" class="!w-180px" clearable placeholder="All">
          <el-option label="Draft" value="draft" />
          <el-option label="Published" value="published" />
          <el-option label="Archived" value="archived" />
        </el-select>
      </el-form-item>
      <el-form-item label="Keyword" prop="keyword">
        <el-input
          v-model="queryParams.keyword"
          class="!w-260px"
          clearable
          placeholder="Title keyword"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> Search</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> Reset</el-button>
        <el-button
          type="primary"
          plain
          @click="openTopicDialog('create')"
          v-hasPermi="['yaya:topic:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> New
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="Part" align="center" prop="part" width="70" />
      <el-table-column label="Title" min-width="210" show-overflow-tooltip>
        <template #default="{ row }">
          <div>{{ row.titleEn || row.titleZh || row.stableKey }}</div>
          <div class="text-12px text-gray-500">{{ row.stableKey }}</div>
        </template>
      </el-table-column>
      <el-table-column label="Topic Type" align="center" prop="topicType" width="110" />
      <el-table-column label="Category" align="center" prop="category" width="110" />
      <el-table-column label="Publish Status" align="center" prop="publishStatus" width="125">
        <template #default="{ row }">
          <el-tag :type="publishStatusTag(row.publishStatus)">
            {{ publishStatusLabel(row.publishStatus) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        label="Updated Time"
        align="center"
        prop="updateTime"
        width="165"
        :formatter="dateFormatter"
      />
      <el-table-column label="Actions" align="center" width="225">
        <template #default="{ row }">
          <el-button link type="primary" @click="openTopicDialog('view', row.id)">View</el-button>
          <el-button
            link
            type="primary"
            @click="openTopicDialog('edit', row.id)"
            v-hasPermi="['yaya:topic:update']"
          >
            Edit
          </el-button>
          <el-button
            link
            type="success"
            :disabled="row.publishStatus === 'published'"
            @click="handlePublishStatus(row, 'published')"
            v-hasPermi="['yaya:topic:publish']"
          >
            Publish
          </el-button>
          <el-button
            link
            type="warning"
            :disabled="row.publishStatus === 'archived'"
            @click="handlePublishStatus(row, 'archived')"
            v-hasPermi="['yaya:topic:publish']"
          >
            Archive
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>

  <Dialog :title="dialogTitle" v-model="dialogVisible" width="1120px">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="Topic" name="topic">
        <el-form
          ref="topicFormRef"
          :disabled="dialogMode === 'view'"
          :model="formData"
          :rules="formRules"
          label-width="120px"
        >
          <el-row :gutter="16">
            <el-col :span="8">
              <el-form-item label="Season ID" prop="seasonId">
                <el-input-number v-model="formData.seasonId" :min="1" class="!w-100%" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="Part" prop="part">
                <el-select v-model="formData.part" class="!w-100%">
                  <el-option label="Part 1" :value="1" />
                  <el-option label="Part 2" :value="2" />
                  <el-option label="Part 3" :value="3" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="Topic No">
                <el-input-number v-model="formData.topicNo" :min="0" class="!w-100%" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="Stable Key" prop="stableKey">
                <el-input v-model="formData.stableKey" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Publish Status">
                <el-select v-model="formData.publishStatus" class="!w-100%">
                  <el-option label="Draft" value="draft" />
                  <el-option label="Published" value="published" />
                  <el-option label="Archived" value="archived" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="Title EN">
                <el-input v-model="formData.titleEn" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Title ZH">
                <el-input v-model="formData.titleZh" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="Topic Type">
                <el-input v-model="formData.topicType" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Category">
                <el-input v-model="formData.category" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="Prompt EN">
            <el-input v-model="formData.promptEn" type="textarea" :rows="4" />
          </el-form-item>
          <el-form-item label="Prompt ZH">
            <el-input v-model="formData.promptZh" type="textarea" :rows="3" />
          </el-form-item>
        </el-form>
      </el-tab-pane>
      <el-tab-pane label="Questions" name="questions">
        <div class="mb-12px">
          <el-button
            type="primary"
            plain
            :disabled="dialogMode === 'view'"
            @click="addQuestion"
            v-hasPermi="['yaya:topic:update']"
          >
            <Icon icon="ep:plus" class="mr-5px" /> Add Question
          </el-button>
        </div>
        <el-table :data="questions" border>
          <el-table-column label="#" type="index" width="60" />
          <el-table-column label="Role" width="150">
            <template #default="{ row }">
              <el-input v-model="row.questionRole" :disabled="dialogMode === 'view'" />
            </template>
          </el-table-column>
          <el-table-column label="Prompt EN" min-width="260">
            <template #default="{ row }">
              <el-input
                v-model="row.promptEn"
                :disabled="dialogMode === 'view'"
                type="textarea"
                :rows="3"
              />
            </template>
          </el-table-column>
          <el-table-column label="Cue Bullets" min-width="220">
            <template #default="{ row }">
              <el-input
                v-model="row.cueText"
                :disabled="dialogMode === 'view'"
                type="textarea"
                :rows="3"
              />
            </template>
          </el-table-column>
          <el-table-column label="Display" width="110">
            <template #default="{ row }">
              <el-input-number
                v-model="row.displayOrder"
                :disabled="dialogMode === 'view'"
                :min="0"
                class="!w-90px"
              />
            </template>
          </el-table-column>
          <el-table-column label="Seconds" width="170">
            <template #default="{ row }">
              <div class="flex gap-8px">
                <el-input-number
                  v-model="row.prepareSeconds"
                  :disabled="dialogMode === 'view'"
                  :min="0"
                  class="!w-70px"
                  controls-position="right"
                />
                <el-input-number
                  v-model="row.answerSeconds"
                  :disabled="dialogMode === 'view'"
                  :min="0"
                  class="!w-70px"
                  controls-position="right"
                />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="Actions" width="90" align="center">
            <template #default="{ $index }">
              <el-button
                link
                type="danger"
                :disabled="dialogMode === 'view'"
                @click="removeQuestion($index)"
              >
                Remove
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>
    <template #footer>
      <el-button @click="dialogVisible = false">Close</el-button>
      <el-button
        v-if="dialogMode !== 'view'"
        type="primary"
        :loading="submitLoading"
        @click="submitTopic"
      >
        Save
      </el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import { dateFormatter } from '@/utils/formatTime'
import * as YayaTopicApi from '@/api/yaya/topic'

defineOptions({ name: 'YayaContentTopic' })

type DialogMode = 'create' | 'edit' | 'view'
type QuestionForm = YayaTopicApi.YayaQuestionVO & { cueText?: string }

const message = useMessage()

const loading = ref(false)
const total = ref(0)
const list = ref<YayaTopicApi.YayaTopicVO[]>([])
const queryFormRef = ref()
const queryParams = reactive<YayaTopicApi.YayaTopicPageReqVO>({
  pageNo: 1,
  pageSize: 10,
  seasonKey: '26Q1',
  part: undefined,
  publishStatus: undefined,
  keyword: ''
})

const dialogVisible = ref(false)
const dialogMode = ref<DialogMode>('view')
const dialogTitle = ref('Topic')
const activeTab = ref('topic')
const topicFormRef = ref()
const submitLoading = ref(false)
const formData = reactive<YayaTopicApi.YayaTopicVO>(emptyTopic())
const questions = ref<QuestionForm[]>([])
const formRules = reactive({
  seasonId: [{ required: true, message: 'Season ID is required', trigger: 'blur' }],
  part: [{ required: true, message: 'Part is required', trigger: 'change' }],
  stableKey: [{ required: true, message: 'Stable key is required', trigger: 'blur' }]
})

function emptyTopic(): YayaTopicApi.YayaTopicVO {
  return {
    seasonId: undefined,
    part: 1,
    stableKey: '',
    topicNo: 0,
    titleEn: '',
    titleZh: '',
    topicType: '',
    category: '',
    promptEn: '',
    promptZh: '',
    displayOrder: 0,
    reviewStatus: 'draft',
    publishStatus: 'draft',
    metadata: {}
  }
}

const resetFormData = () => {
  Object.assign(formData, emptyTopic())
  questions.value = []
  topicFormRef.value?.resetFields()
}

const getList = async () => {
  loading.value = true
  try {
    const data = await YayaTopicApi.YayaTopicApi.getTopicPage(queryParams)
    list.value = data.list || []
    total.value = data.total || 0
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

const openTopicDialog = async (mode: DialogMode, id?: number) => {
  resetFormData()
  dialogMode.value = mode
  activeTab.value = 'topic'
  dialogTitle.value =
    mode === 'create' ? 'New Topic' : mode === 'edit' ? 'Edit Topic' : 'View Topic'
  dialogVisible.value = true
  if (!id) {
    return
  }
  const detail = await YayaTopicApi.YayaTopicApi.getTopic(id)
  Object.assign(formData, detail)
  questions.value = (detail.questions || []).map((question) => ({
    ...question,
    cueText: (question.cueBullets || []).join('\n')
  }))
}

const addQuestion = () => {
  questions.value.push({
    questionRole: 'question',
    promptEn: '',
    promptZh: '',
    cueText: '',
    displayOrder: questions.value.length + 1,
    prepareSeconds: undefined,
    answerSeconds: undefined,
    metadata: {}
  })
}

const removeQuestion = (index: number) => {
  questions.value.splice(index, 1)
}

const toQuestionPayload = (question: QuestionForm): YayaTopicApi.YayaQuestionVO => {
  const cueBullets = (question.cueText || '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
  return {
    legacyUuid: question.legacyUuid,
    questionRole: question.questionRole,
    promptEn: question.promptEn,
    promptZh: question.promptZh,
    cueBullets,
    displayOrder: question.displayOrder,
    prepareSeconds: question.prepareSeconds,
    answerSeconds: question.answerSeconds,
    metadata: question.metadata || {}
  }
}

const submitTopic = async () => {
  await topicFormRef.value.validate()
  submitLoading.value = true
  try {
    const payload: YayaTopicApi.YayaTopicVO = { ...formData }
    const topicId =
      dialogMode.value === 'create'
        ? await YayaTopicApi.YayaTopicApi.createTopic(payload)
        : formData.id!
    if (dialogMode.value === 'edit') {
      await YayaTopicApi.YayaTopicApi.updateTopic(topicId, payload)
    }
    await YayaTopicApi.YayaTopicApi.replaceQuestions(topicId, {
      questions: questions.value.map(toQuestionPayload)
    })
    message.success('Saved')
    dialogVisible.value = false
    await getList()
  } finally {
    submitLoading.value = false
  }
}

const handlePublishStatus = async (row: YayaTopicApi.YayaTopicVO, publishStatus: string) => {
  await message.confirm(`Set topic ${row.stableKey} to ${publishStatus}?`)
  await YayaTopicApi.YayaTopicApi.updatePublishStatus(row.id!, { publishStatus })
  message.success('Updated')
  await getList()
}

const publishStatusLabel = (status?: string) => {
  if (status === 'published') {
    return 'Published'
  }
  if (status === 'archived') {
    return 'Archived'
  }
  return 'Draft'
}

const publishStatusTag = (status?: string) => {
  if (status === 'published') {
    return 'success'
  }
  if (status === 'archived') {
    return 'warning'
  }
  return 'info'
}

onMounted(() => {
  getList()
})
</script>
