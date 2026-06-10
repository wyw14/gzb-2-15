<template>
  <div class="publish">
    <div class="card">
      <h1 class="page-title">发布你的技能</h1>

      <div class="skill-tabs">
        <div
          v-for="tab in tabs"
          :key="tab.value"
          class="tab-item"
          :class="{ active: activeTab === tab.value }"
          @click="activeTab = tab.value"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          <span>{{ tab.label }}</span>
        </div>
      </div>

      <div v-if="mySkills.length" class="my-skills">
        <h3 class="subsection-title">我已发布的{{ activeTab === 'teach' ? '可教' : '想学' }}</h3>
        <div class="skills-list">
          <div v-for="skill in filteredSkills" :key="skill.id" class="skill-item">
            <div class="skill-main-info">
              <span class="skill-name">{{ skill.name }}</span>
              <span class="skill-category">{{ getCategoryName(skill.category) }}</span>
              <span v-if="skill.level" class="skill-level">{{ skill.level }}</span>
              <span class="skill-desc">{{ skill.description }}</span>
            </div>
            <div class="skill-actions">
              <el-button
                v-if="activeTab === 'teach'"
                type="primary"
                size="small"
                @click="openPortfolioDialog(skill)"
              >
                作品集 ({{ getPortfolioCount(skill.id) }})
              </el-button>
              <el-button type="danger" size="small" @click="deleteSkill(skill.id)">删除</el-button>
            </div>
          </div>
        </div>
      </div>

      <el-form :model="form" :rules="rules" ref="formRef" class="publish-form">
        <el-form-item prop="name" label="技能名称">
          <el-input v-model="form.name" placeholder="例如：Python编程、吉他演奏、英语口语" size="large" />
        </el-form-item>

        <el-form-item prop="category" label="技能类别">
          <el-select v-model="form.category" placeholder="选择类别" size="large" style="width: 100%">
            <el-option v-for="cat in categories" :key="cat.id" :label="`${cat.icon} ${cat.name}`" :value="cat.id" />
          </el-select>
        </el-form-item>

        <el-form-item label="技能等级" v-if="activeTab === 'teach'">
          <el-radio-group v-model="form.level" size="large">
            <el-radio value="入门">入门</el-radio>
            <el-radio value="初级">初级</el-radio>
            <el-radio value="中级">中级</el-radio>
            <el-radio value="高级">高级</el-radio>
            <el-radio value="专家">专家</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="简单描述一下这个技能..."
            maxlength="200"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="期望学习方式">
          <el-radio-group v-model="form.onlinePreference" size="large">
            <el-radio value="online">线上</el-radio>
            <el-radio value="offline">线下</el-radio>
            <el-radio value="both">都可以</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="可用时间段">
          <el-checkbox-group v-model="form.availableTime">
            <el-checkbox value="工作日白天">工作日白天</el-checkbox>
            <el-checkbox value="工作日晚上">工作日晚上</el-checkbox>
            <el-checkbox value="周末白天">周末白天</el-checkbox>
            <el-checkbox value="周末晚上">周末晚上</el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-button type="primary" size="large" @click="publish" :loading="loading">
          {{ activeTab === 'teach' ? '发布可教技能' : '发布想学技能' }}
        </el-button>
      </el-form>
    </div>

    <div class="card" v-if="!hasPreferences">
      <h2 class="section-title">📍 设置偏好</h2>
      <p class="tip">完善你的时间和地域偏好，获得更精准的匹配</p>
      <el-form :model="prefsForm" class="prefs-form">
        <el-form-item label="所在城市">
          <el-input v-model="prefsForm.city" placeholder="例如：北京市朝阳区" size="large" />
        </el-form-item>
        <el-form-item label="省份">
          <el-input v-model="prefsForm.province" placeholder="例如：北京市" size="large" />
        </el-form-item>
        <el-button type="primary" @click="savePreferences">保存偏好</el-button>
      </el-form>
    </div>

    <el-dialog
      v-model="showPortfolioDialog"
      :title="`作品集管理 - ${currentSkill?.name || ''}`"
      width="700px"
    >
      <div class="portfolio-list">
        <div v-if="portfolios.length === 0" class="empty-portfolios">
          <el-empty description="还没有添加案例，添加一些作品来证明你的技能吧！" />
        </div>
        <div v-else class="portfolio-items">
          <div v-for="item in portfolios" :key="item.id" class="portfolio-item">
            <div class="portfolio-content">
              <div class="portfolio-header">
                <span class="portfolio-title">{{ item.title }}</span>
                <el-tag
                  :type="item.isPublic ? 'success' : 'info'"
                  size="small"
                >
                  {{ item.isPublic ? '公开' : '私密' }}
                </el-tag>
                <el-tag type="warning" size="small">
                  {{ item.teachingStage }}
                </el-tag>
              </div>
              <div v-if="item.link" class="portfolio-link">
                <el-icon><Link /></el-icon>
                <a :href="item.link" target="_blank">{{ item.link }}</a>
              </div>
              <div v-if="item.description" class="portfolio-desc">
                {{ item.description }}
              </div>
            </div>
            <div class="portfolio-actions">
              <el-button size="small" @click="editPortfolio(item)">编辑</el-button>
              <el-button size="small" type="danger" @click="deletePortfolio(item.id)">删除</el-button>
            </div>
          </div>
        </div>
      </div>

      <div class="add-portfolio-section">
        <h4 class="subsection-title">{{ editingPortfolio ? '编辑案例' : '添加新案例' }}</h4>
        <el-form :model="portfolioForm" label-position="top">
          <el-form-item label="案例标题" required>
            <el-input v-model="portfolioForm.title" placeholder="例如：XX公司官网开发、XX课程教学经历" />
          </el-form-item>
          <el-form-item label="作品链接">
            <el-input v-model="portfolioForm.link" placeholder="例如：https://github.com/xxx、个人博客等" />
          </el-form-item>
          <el-form-item label="案例说明">
            <el-input
              v-model="portfolioForm.description"
              type="textarea"
              :rows="3"
              placeholder="详细描述一下这个案例，比如你做了什么、取得了什么成果..."
              maxlength="300"
              show-word-limit
            />
          </el-form-item>
          <el-form-item label="适合教学阶段">
            <el-select v-model="portfolioForm.teachingStage" style="width: 100%">
              <el-option value="入门" label="入门" />
              <el-option value="初级" label="初级" />
              <el-option value="中级" label="中级" />
              <el-option value="高级" label="高级" />
              <el-option value="专家" label="专家" />
            </el-select>
          </el-form-item>
          <el-form-item label="是否公开">
            <el-switch v-model="portfolioForm.isPublic" active-text="公开" inactive-text="私密" />
            <div class="form-tip">公开后，其他用户可以在匹配卡片、主页和发起交换时看到</div>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="submitPortfolio" :loading="portfolioLoading">
              {{ editingPortfolio ? '保存修改' : '添加案例' }}
            </el-button>
            <el-button v-if="editingPortfolio" @click="cancelEdit">取消</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '../stores/user'
import { skillAPI, authAPI } from '../api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Link } from '@element-plus/icons-vue'

const userStore = useUserStore()
const formRef = ref()
const loading = ref(false)
const activeTab = ref('teach')
const categories = ref([])
const mySkills = ref([])
const hasPreferences = ref(false)

const showPortfolioDialog = ref(false)
const currentSkill = ref(null)
const portfolios = ref([])
const allPortfolios = ref({})
const editingPortfolio = ref(null)
const portfolioLoading = ref(false)
const portfolioForm = ref({
  title: '',
  link: '',
  description: '',
  teachingStage: '入门',
  isPublic: true
})

const tabs = [
  { value: 'teach', label: '我可以教', icon: '🎓' },
  { value: 'learn', label: '我想要学', icon: '📖' }
]

const form = ref({
  name: '',
  category: '',
  type: 'teach',
  level: '中级',
  description: '',
  onlinePreference: 'both',
  availableTime: []
})

const prefsForm = ref({
  city: '',
  province: ''
})

const rules = {
  name: [{ required: true, message: '请输入技能名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择技能类别', trigger: 'change' }]
}

const filteredSkills = computed(() =>
  mySkills.value.filter(s => s.type === activeTab.value)
)

onMounted(async () => {
  await loadCategories()
  await loadMySkills()
  checkPreferences()
})

async function loadCategories() {
  const res = await skillAPI.getCategories()
  categories.value = res.data
}

async function loadMySkills() {
  const res = await skillAPI.getSkills({ userId: userStore.user.id })
  mySkills.value = res.data
}

function checkPreferences() {
  const prefs = userStore.user?.preferences
  hasPreferences.value = prefs?.location?.city && prefs?.location?.province
  if (prefs) {
    prefsForm.value.city = prefs.location?.city || ''
    prefsForm.value.province = prefs.location?.province || ''
  }
}

function getCategoryName(id) {
  const cat = categories.value.find(c => c.id === id)
  return cat ? `${cat.icon} ${cat.name}` : id
}

async function publish() {
  try {
    await formRef.value.validate()
    loading.value = true
    await skillAPI.createSkill({
      ...form.value,
      type: activeTab.value
    })
    ElMessage.success('发布成功')
    form.value = {
      name: '',
      category: '',
      type: activeTab.value,
      level: '中级',
      description: '',
      onlinePreference: 'both',
      availableTime: []
    }
    await loadMySkills()
  } catch (e) {
    ElMessage.error('发布失败')
  } finally {
    loading.value = false
  }
}

async function deleteSkill(id) {
  try {
    await ElMessageBox.confirm('确定删除这个技能吗？', '提示', { type: 'warning' })
    await skillAPI.deleteSkill(id)
    ElMessage.success('删除成功')
    await loadMySkills()
  } catch {}
}

async function savePreferences() {
  await userStore.updateProfile({
    preferences: {
      ...userStore.user.preferences,
      location: {
        city: prefsForm.value.city,
        province: prefsForm.value.province
      }
    }
  })
  ElMessage.success('偏好设置成功')
  hasPreferences.value = true
}

async function openPortfolioDialog(skill) {
  currentSkill.value = skill
  showPortfolioDialog.value = true
  editingPortfolio.value = null
  resetPortfolioForm()
  await loadPortfolios(skill.id)
}

async function loadPortfolios(skillId) {
  try {
    const res = await skillAPI.getPortfolios(skillId)
    portfolios.value = res.data
    allPortfolios.value[skillId] = res.data
  } catch (e) {
    portfolios.value = []
  }
}

function getPortfolioCount(skillId) {
  return allPortfolios.value[skillId]?.length || 0
}

function resetPortfolioForm() {
  portfolioForm.value = {
    title: '',
    link: '',
    description: '',
    teachingStage: '入门',
    isPublic: true
  }
}

async function submitPortfolio() {
  if (!portfolioForm.value.title) {
    ElMessage.warning('请填写案例标题')
    return
  }

  try {
    portfolioLoading.value = true
    if (editingPortfolio.value) {
      await skillAPI.updatePortfolio(editingPortfolio.value.id, portfolioForm.value)
      ElMessage.success('修改成功')
    } else {
      await skillAPI.createPortfolio(currentSkill.value.id, portfolioForm.value)
      ElMessage.success('添加成功')
    }
    editingPortfolio.value = null
    resetPortfolioForm()
    await loadPortfolios(currentSkill.value.id)
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  } finally {
    portfolioLoading.value = false
  }
}

function editPortfolio(item) {
  editingPortfolio.value = item
  portfolioForm.value = {
    title: item.title,
    link: item.link,
    description: item.description,
    teachingStage: item.teachingStage,
    isPublic: item.isPublic
  }
}

function cancelEdit() {
  editingPortfolio.value = null
  resetPortfolioForm()
}

async function deletePortfolio(id) {
  try {
    await ElMessageBox.confirm('确定删除这个案例吗？', '提示', { type: 'warning' })
    await skillAPI.deletePortfolio(id)
    ElMessage.success('删除成功')
    await loadPortfolios(currentSkill.value.id)
  } catch {}
}
</script>

<style scoped>
.publish {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.skill-tabs {
  display: flex;
  gap: 16px;
  margin-bottom: 32px;
}

.tab-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 500;
}

.tab-item:hover {
  background: #e8eaf6;
}

.tab-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.tab-icon {
  font-size: 24px;
}

.my-skills {
  margin-bottom: 32px;
}

.subsection-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.skills-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skill-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
}

.skill-main-info {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;
}

.skill-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.skill-name {
  font-weight: 600;
  color: #333;
}

.skill-category {
  color: #667eea;
  font-size: 13px;
}

.skill-level {
  background: #e3f2fd;
  color: #1565c0;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
}

.skill-desc {
  color: #666;
  font-size: 13px;
}

.publish-form {
  max-width: 600px;
}

.tip {
  color: #666;
  margin-bottom: 16px;
}

.prefs-form {
  max-width: 500px;
}

.portfolio-list {
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #eee;
}

.portfolio-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.portfolio-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
}

.portfolio-content {
  flex: 1;
  min-width: 0;
}

.portfolio-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.portfolio-title {
  font-weight: 600;
  color: #333;
  font-size: 15px;
}

.portfolio-link {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
  font-size: 13px;
  color: #667eea;
}

.portfolio-link a {
  color: #667eea;
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 400px;
}

.portfolio-link a:hover {
  text-decoration: underline;
}

.portfolio-desc {
  color: #666;
  font-size: 13px;
  line-height: 1.6;
}

.portfolio-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.add-portfolio-section .form-tip {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.empty-portfolios {
  padding: 24px 0;
}
</style>
