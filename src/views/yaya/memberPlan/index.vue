<template>
  <ContentWrap>
    <el-button type="primary" plain @click="openPlanDialog('create')" v-hasPermi="['yaya:member-plan:create']">
      <Icon icon="ep:plus" class="mr-5px" /> New
    </el-button>
    <el-button :loading="loading" @click="getList">
      <Icon icon="ep:refresh" class="mr-5px" /> Refresh
    </el-button>
  </ContentWrap>

  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="Plan Key" min-width="150" prop="planKey" />
      <el-table-column label="Name" min-width="150" prop="name" />
      <el-table-column label="Description" min-width="220" prop="description" show-overflow-tooltip />
      <el-table-column label="Price" align="center" width="110">
        <template #default="{ row }">{{ formatPrice(row.priceCent, row.currency) }}</template>
      </el-table-column>
      <el-table-column label="Duration" align="center" width="110">
        <template #default="{ row }">{{ row.durationDays || 0 }} days</template>
      </el-table-column>
      <el-table-column label="Status" align="center" width="110">
        <template #default="{ row }">
          <el-tag :type="row.active === 1 ? 'success' : 'info'">
            {{ row.active === 1 ? 'Active' : 'Inactive' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Actions" align="center" width="190">
        <template #default="{ row }">
          <el-button link type="primary" @click="openPlanDialog('edit', row)" v-hasPermi="['yaya:member-plan:update']">
            Edit
          </el-button>
          <el-button link :type="row.active === 1 ? 'warning' : 'success'" @click="toggleStatus(row)" v-hasPermi="['yaya:member-plan:update']">
            {{ row.active === 1 ? 'Disable' : 'Enable' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </ContentWrap>

  <Dialog :title="dialogTitle" v-model="dialogVisible" width="760px">
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="120px">
      <el-form-item label="Plan Key" prop="planKey">
        <el-input v-model="formData.planKey" :disabled="dialogMode === 'edit'" />
      </el-form-item>
      <el-form-item label="Name" prop="name">
        <el-input v-model="formData.name" />
      </el-form-item>
      <el-form-item label="Description">
        <el-input v-model="formData.description" type="textarea" :rows="3" />
      </el-form-item>
      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="Price Cent">
            <el-input-number v-model="formData.priceCent" :min="0" class="!w-100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="Currency">
            <el-input v-model="formData.currency" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="Duration">
            <el-input-number v-model="formData.durationDays" :min="1" class="!w-100%" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="Active">
        <el-switch v-model="activeSwitch" />
      </el-form-item>
      <el-form-item label="Benefits JSON">
        <el-input v-model="benefitsText" type="textarea" :rows="6" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">Close</el-button>
      <el-button type="primary" :loading="submitLoading" @click="submitPlan">Save</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import * as YayaMemberPlanApi from '@/api/yaya/memberPlan'

defineOptions({ name: 'YayaMemberPlan' })

type DialogMode = 'create' | 'edit'

const message = useMessage()

const loading = ref(false)
const submitLoading = ref(false)
const list = ref<YayaMemberPlanApi.YayaMemberPlanVO[]>([])
const dialogVisible = ref(false)
const dialogMode = ref<DialogMode>('create')
const dialogTitle = ref('Member Plan')
const formRef = ref()
const benefitsText = ref('{}')
const activeSwitch = ref(true)
const formData = reactive<YayaMemberPlanApi.YayaMemberPlanVO>(emptyPlan())
const formRules = reactive({
  planKey: [{ required: true, message: 'Plan key is required', trigger: 'blur' }],
  name: [{ required: true, message: 'Name is required', trigger: 'blur' }]
})

function emptyPlan(): YayaMemberPlanApi.YayaMemberPlanVO {
  return {
    planKey: '',
    name: '',
    description: '',
    priceCent: 0,
    currency: 'CNY',
    durationDays: 30,
    active: 1,
    benefits: {}
  }
}

const resetFormData = () => {
  Object.assign(formData, emptyPlan())
  benefitsText.value = '{}'
  activeSwitch.value = true
  formRef.value?.resetFields()
}

const getList = async () => {
  loading.value = true
  try {
    list.value = await YayaMemberPlanApi.YayaMemberPlanApi.getPlanList()
  } finally {
    loading.value = false
  }
}

const openPlanDialog = (mode: DialogMode, row?: YayaMemberPlanApi.YayaMemberPlanVO) => {
  resetFormData()
  dialogMode.value = mode
  dialogTitle.value = mode === 'create' ? 'New Member Plan' : 'Edit Member Plan'
  if (row) {
    Object.assign(formData, { ...row })
    activeSwitch.value = row.active === 1
    benefitsText.value = JSON.stringify(row.benefits || {}, null, 2)
  }
  dialogVisible.value = true
}

const submitPlan = async () => {
  await formRef.value.validate()
  submitLoading.value = true
  try {
    const benefits = JSON.parse(benefitsText.value || '{}')
    const payload = {
      ...formData,
      active: activeSwitch.value ? 1 : 0,
      benefits
    }
    if (dialogMode.value === 'create') {
      await YayaMemberPlanApi.YayaMemberPlanApi.createPlan(payload)
    } else {
      await YayaMemberPlanApi.YayaMemberPlanApi.updatePlan(formData.id!, payload)
    }
    message.success('Saved')
    dialogVisible.value = false
    await getList()
  } catch (error) {
    if (error instanceof SyntaxError) {
      message.error('Benefits JSON is invalid')
    } else {
      throw error
    }
  } finally {
    submitLoading.value = false
  }
}

const toggleStatus = async (row: YayaMemberPlanApi.YayaMemberPlanVO) => {
  const active = row.active === 1 ? 0 : 1
  await message.confirm(`${active === 1 ? 'Enable' : 'Disable'} ${row.planKey}?`)
  await YayaMemberPlanApi.YayaMemberPlanApi.updatePlanStatus(row.id!, active)
  message.success('Updated')
  await getList()
}

const formatPrice = (priceCent?: number, currency?: string) => {
  return `${currency || 'CNY'} ${((priceCent || 0) / 100).toFixed(2)}`
}

onMounted(() => {
  getList()
})
</script>
