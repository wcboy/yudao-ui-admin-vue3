<template>
  <ContentWrap>
    <el-form
      ref="queryFormRef"
      class="-mb-15px"
      :inline="true"
      :model="queryParams"
      label-width="88px"
    >
      <el-form-item label="Category" prop="category">
        <el-select v-model="queryParams.category" class="!w-180px" clearable placeholder="All">
          <el-option v-for="item in CATEGORY_OPTIONS" :key="item" :label="item" :value="item" />
        </el-select>
      </el-form-item>
      <el-form-item label="Status" prop="status">
        <el-select v-model="queryParams.status" class="!w-160px" clearable placeholder="All">
          <el-option v-for="item in STATUS_OPTIONS" :key="item" :label="item" :value="item" />
        </el-select>
      </el-form-item>
      <el-form-item label="Keyword" prop="keyword">
        <el-input
          v-model="queryParams.keyword"
          class="!w-240px"
          clearable
          placeholder="Name / code / base URL"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> Search</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> Reset</el-button>
        <el-button
          type="primary"
          plain
          @click="openEndpointDialog('create')"
          v-hasPermi="['yaya:model-endpoint:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> New
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="Name" min-width="160" prop="name" show-overflow-tooltip />
      <el-table-column label="Code" min-width="150" prop="code" show-overflow-tooltip />
      <el-table-column label="Category" align="center" prop="category" width="130" />
      <el-table-column label="Protocol" align="center" prop="protocol" width="130" />
      <el-table-column label="Base URL" min-width="200" prop="baseUrl" show-overflow-tooltip />
      <el-table-column label="API Key" align="center" prop="apiKeyMasked" width="130">
        <template #default="{ row }">{{ row.apiKeyMasked || '-' }}</template>
      </el-table-column>
      <el-table-column label="Status" align="center" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'enabled' ? 'success' : 'info'">
            {{ row.status === 'enabled' ? 'Enabled' : 'Disabled' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Health" align="center" width="110">
        <template #default="{ row }">
          <el-tooltip
            v-if="row.health === 'down' && row.lastError"
            :content="row.lastError"
            placement="top"
          >
            <el-tag :type="healthTagType(row.health)">{{ healthLabel(row.health) }}</el-tag>
          </el-tooltip>
          <el-tag v-else :type="healthTagType(row.health)">{{ healthLabel(row.health) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column
        label="Updated Time"
        align="center"
        prop="updateTime"
        width="165"
        :formatter="dateFormatter"
      />
      <el-table-column label="Actions" align="center" width="160">
        <template #default="{ row }">
          <el-button
            link
            type="primary"
            @click="openEndpointDialog('edit', row.id)"
            v-hasPermi="['yaya:model-endpoint:update']"
          >
            Edit
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(row)"
            v-hasPermi="['yaya:model-endpoint:delete']"
          >
            Delete
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

  <Dialog :title="dialogTitle" v-model="dialogVisible" width="760px">
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="120px">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="Code" prop="code">
            <el-input v-model="formData.code" :disabled="dialogMode === 'edit'" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="Name" prop="name">
            <el-input v-model="formData.name" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="Category" prop="category">
            <el-select v-model="formData.category" class="!w-100%">
              <el-option v-for="item in CATEGORY_OPTIONS" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="Protocol" prop="protocol">
            <el-select v-model="formData.protocol" class="!w-100%">
              <el-option v-for="item in PROTOCOL_OPTIONS" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="Base URL" prop="baseUrl">
        <el-input v-model="formData.baseUrl" placeholder="https://..." />
      </el-form-item>
      <el-form-item label="API Key" prop="apiKey">
        <el-input
          v-model="formData.apiKey"
          type="password"
          show-password
          :placeholder="dialogMode === 'edit' ? 'Leave blank to keep current key' : 'API key'"
        />
      </el-form-item>
      <el-form-item label="Extra (JSON)">
        <el-input
          v-model="extraText"
          type="textarea"
          :rows="5"
          placeholder='{}'
        />
      </el-form-item>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="Status" prop="status">
            <el-select v-model="formData.status" class="!w-100%">
              <el-option v-for="item in STATUS_OPTIONS" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="Remark">
        <el-input v-model="formData.remark" type="textarea" :rows="2" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">Close</el-button>
      <el-button type="primary" :loading="submitLoading" @click="submitEndpoint">Save</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import { dateFormatter } from '@/utils/formatTime'
import { YayaModelEndpointApi, YayaModelEndpointVO } from '@/api/yaya/modelRegistry/endpoint'

defineOptions({ name: 'YayaModelEndpoint' })

type DialogMode = 'create' | 'edit'

const CATEGORY_OPTIONS = [
  'llm_chat',
  'llm_audio',
  'stt',
  'embedding',
  'azure_speech',
  'deepgram',
  's3'
]
const PROTOCOL_OPTIONS = ['openai_compat', 'azure_sdk', 'deepgram', 's3']
const STATUS_OPTIONS = ['enabled', 'disabled']

const message = useMessage()

const loading = ref(false)
const total = ref(0)
const list = ref<YayaModelEndpointVO[]>([])
const queryFormRef = ref()
const queryParams = reactive<{
  pageNo: number
  pageSize: number
  category?: string
  status?: string
  keyword?: string
}>({
  pageNo: 1,
  pageSize: 10,
  category: undefined,
  status: undefined,
  keyword: ''
})

const dialogVisible = ref(false)
const dialogMode = ref<DialogMode>('create')
const dialogTitle = ref('Endpoint')
const formRef = ref()
const submitLoading = ref(false)
const extraText = ref('{}')
const formData = reactive<YayaModelEndpointVO>(emptyEndpoint())
const formRules = reactive({
  code: [{ required: true, message: 'Code is required', trigger: 'blur' }],
  name: [{ required: true, message: 'Name is required', trigger: 'blur' }],
  category: [{ required: true, message: 'Category is required', trigger: 'change' }],
  protocol: [{ required: true, message: 'Protocol is required', trigger: 'change' }],
  baseUrl: [{ required: true, message: 'Base URL is required', trigger: 'blur' }],
  status: [{ required: true, message: 'Status is required', trigger: 'change' }]
})

function emptyEndpoint(): YayaModelEndpointVO {
  return {
    code: '',
    name: '',
    category: 'llm_chat',
    protocol: 'openai_compat',
    baseUrl: '',
    apiKey: '',
    extra: {},
    status: 'enabled',
    remark: ''
  }
}

const resetFormData = () => {
  Object.assign(formData, emptyEndpoint())
  extraText.value = '{}'
  formRef.value?.resetFields()
}

const getList = async () => {
  loading.value = true
  try {
    const data = await YayaModelEndpointApi.getEndpointPage(queryParams)
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

const openEndpointDialog = async (mode: DialogMode, id?: number) => {
  resetFormData()
  dialogMode.value = mode
  dialogTitle.value = mode === 'create' ? 'New Endpoint' : 'Edit Endpoint'
  dialogVisible.value = true
  if (!id) {
    return
  }
  const detail = await YayaModelEndpointApi.getEndpoint(id)
  Object.assign(formData, detail)
  // apiKey is never returned; keep blank so an unchanged save preserves the stored key
  formData.apiKey = ''
  extraText.value = JSON.stringify(detail.extra || {}, null, 2)
}

const submitEndpoint = async () => {
  await formRef.value.validate()
  submitLoading.value = true
  try {
    let extra: Record<string, any>
    try {
      extra = JSON.parse(extraText.value || '{}')
    } catch {
      message.error('Extra must be valid JSON')
      return
    }
    const payload: YayaModelEndpointVO = { ...formData, extra }
    // Blank apiKey on edit means "do not change" — drop it so backend keeps the stored key
    if (dialogMode.value === 'edit' && !payload.apiKey) {
      delete payload.apiKey
    }
    if (dialogMode.value === 'create') {
      await YayaModelEndpointApi.createEndpoint(payload)
    } else {
      await YayaModelEndpointApi.updateEndpoint(payload)
    }
    message.success('Saved')
    dialogVisible.value = false
    await getList()
  } finally {
    submitLoading.value = false
  }
}

const handleDelete = async (row: YayaModelEndpointVO) => {
  await message.confirm(`Delete endpoint ${row.name || row.code}?`)
  await YayaModelEndpointApi.deleteEndpoint(row.id!)
  message.success('Deleted')
  await getList()
}

const healthLabel = (health?: string) => {
  if (health === 'healthy') {
    return 'Healthy'
  }
  if (health === 'down') {
    return 'Down'
  }
  return 'Unknown'
}

const healthTagType = (health?: string) => {
  if (health === 'healthy') {
    return 'success'
  }
  if (health === 'down') {
    return 'danger'
  }
  return 'info'
}

onMounted(() => {
  getList()
})
</script>
