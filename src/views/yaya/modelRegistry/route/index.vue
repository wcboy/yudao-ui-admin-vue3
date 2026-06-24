<template>
  <ContentWrap>
    <el-button
      type="primary"
      plain
      @click="openRouteDialog('create')"
      v-hasPermi="['yaya:model-route:create']"
    >
      <Icon icon="ep:plus" class="mr-5px" /> New
    </el-button>
    <el-button :loading="loading" @click="getList">
      <Icon icon="ep:refresh" class="mr-5px" /> Refresh
    </el-button>
  </ContentWrap>

  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="Logical Name" min-width="160" prop="logicalName" />
      <el-table-column label="Ordered Endpoints" min-width="320">
        <template #default="{ row }: { row: YayaModelRouteVO }">
          <template v-if="(row.orderedEndpointIds || []).length">
            <el-tag
              v-for="(endpointId, index) in row.orderedEndpointIds"
              :key="endpointId"
              class="mr-5px mb-3px"
              type="info"
            >
              {{ index + 1 }}. {{ endpointLabel(endpointId) }}
            </el-tag>
          </template>
          <span v-else class="text-gray-400">-</span>
        </template>
      </el-table-column>
      <el-table-column label="Strategy" align="center" prop="strategy" width="120" />
      <el-table-column label="Status" align="center" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'enabled' ? 'success' : 'info'">
            {{ row.status === 'enabled' ? 'Enabled' : 'Disabled' }}
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
      <el-table-column label="Actions" align="center" width="160">
        <template #default="{ row }">
          <el-button
            link
            type="primary"
            @click="openRouteDialog('edit', row)"
            v-hasPermi="['yaya:model-route:update']"
          >
            Edit
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(row)"
            v-hasPermi="['yaya:model-route:delete']"
          >
            Delete
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </ContentWrap>

  <Dialog :title="dialogTitle" v-model="dialogVisible" width="720px">
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="140px">
      <el-form-item label="Logical Name" prop="logicalName">
        <el-input v-model="formData.logicalName" :disabled="dialogMode === 'edit'" />
      </el-form-item>
      <el-form-item label="Ordered Endpoints" prop="orderedEndpointIds">
        <el-select
          v-model="formData.orderedEndpointIds"
          class="!w-100%"
          multiple
          filterable
          placeholder="Select in priority order (first = highest priority)"
        >
          <el-option
            v-for="item in endpointOptions"
            :key="item.id"
            :label="endpointOptionLabel(item)"
            :value="item.id!"
          />
        </el-select>
        <div class="text-12px text-gray-500 mt-4px">
          Selection order is the failover priority (top of the list is tried first).
        </div>
      </el-form-item>
      <el-form-item label="Strategy" prop="strategy">
        <el-select v-model="formData.strategy" class="!w-100%">
          <el-option v-for="item in STRATEGY_OPTIONS" :key="item" :label="item" :value="item" />
        </el-select>
      </el-form-item>
      <el-form-item label="Status" prop="status">
        <el-select v-model="formData.status" class="!w-100%">
          <el-option v-for="item in STATUS_OPTIONS" :key="item" :label="item" :value="item" />
        </el-select>
      </el-form-item>
      <el-form-item label="Remark">
        <el-input v-model="formData.remark" type="textarea" :rows="2" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">Close</el-button>
      <el-button type="primary" :loading="submitLoading" @click="submitRoute">Save</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import { dateFormatter } from '@/utils/formatTime'
import { YayaModelRouteApi, YayaModelRouteVO } from '@/api/yaya/modelRegistry/route'
import { YayaModelEndpointApi, YayaModelEndpointVO } from '@/api/yaya/modelRegistry/endpoint'

defineOptions({ name: 'YayaModelRoute' })

type DialogMode = 'create' | 'edit'

const STRATEGY_OPTIONS = ['priority']
const STATUS_OPTIONS = ['enabled', 'disabled']

const message = useMessage()

const loading = ref(false)
const list = ref<YayaModelRouteVO[]>([])
const endpointOptions = ref<YayaModelEndpointVO[]>([])

const dialogVisible = ref(false)
const dialogMode = ref<DialogMode>('create')
const dialogTitle = ref('Route')
const formRef = ref()
const submitLoading = ref(false)
const formData = reactive<YayaModelRouteVO>(emptyRoute())
const formRules = reactive({
  logicalName: [{ required: true, message: 'Logical name is required', trigger: 'blur' }],
  orderedEndpointIds: [
    { required: true, type: 'array', min: 1, message: 'Select at least one endpoint', trigger: 'change' }
  ],
  strategy: [{ required: true, message: 'Strategy is required', trigger: 'change' }],
  status: [{ required: true, message: 'Status is required', trigger: 'change' }]
})

function emptyRoute(): YayaModelRouteVO {
  return {
    logicalName: '',
    orderedEndpointIds: [],
    strategy: 'priority',
    status: 'enabled',
    remark: ''
  }
}

const endpointMap = computed(() => {
  const map: Record<number, YayaModelEndpointVO> = {}
  endpointOptions.value.forEach((item) => {
    if (item.id != null) {
      map[item.id] = item
    }
  })
  return map
})

const endpointOptionLabel = (item: YayaModelEndpointVO) => {
  return item.name ? `${item.name} (${item.code})` : item.code || `#${item.id}`
}

const endpointLabel = (id: number) => {
  const item = endpointMap.value[id]
  return item ? endpointOptionLabel(item) : `#${id}`
}

const resetFormData = () => {
  Object.assign(formData, emptyRoute())
  formRef.value?.resetFields()
}

const loadEndpointOptions = async () => {
  const data = await YayaModelEndpointApi.getEndpointPage({ pageNo: 1, pageSize: 100 })
  endpointOptions.value = data.list || []
}

const getList = async () => {
  loading.value = true
  try {
    list.value = await YayaModelRouteApi.getRouteList()
  } finally {
    loading.value = false
  }
}

const openRouteDialog = async (mode: DialogMode, row?: YayaModelRouteVO) => {
  resetFormData()
  dialogMode.value = mode
  dialogTitle.value = mode === 'create' ? 'New Route' : 'Edit Route'
  await loadEndpointOptions()
  if (row) {
    Object.assign(formData, {
      ...row,
      orderedEndpointIds: [...(row.orderedEndpointIds || [])]
    })
  }
  dialogVisible.value = true
}

const submitRoute = async () => {
  await formRef.value.validate()
  submitLoading.value = true
  try {
    const payload: YayaModelRouteVO = { ...formData }
    if (dialogMode.value === 'create') {
      await YayaModelRouteApi.createRoute(payload)
    } else {
      await YayaModelRouteApi.updateRoute(payload)
    }
    message.success('Saved')
    dialogVisible.value = false
    await getList()
  } finally {
    submitLoading.value = false
  }
}

const handleDelete = async (row: YayaModelRouteVO) => {
  await message.confirm(`Delete route ${row.logicalName}?`)
  await YayaModelRouteApi.deleteRoute(row.id!)
  message.success('Deleted')
  await getList()
}

onMounted(async () => {
  await loadEndpointOptions()
  await getList()
})
</script>
