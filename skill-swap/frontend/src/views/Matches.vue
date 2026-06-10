<template>
  <div class="matches">
    <div class="card">
      <h1 class="page-title">智能匹配</h1>

      <div class="filter-bar">
        <el-input v-model="filters.keyword" placeholder="搜索技能" clearable style="width: 200px">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-select v-model="filters.category" placeholder="技能类别" clearable style="width: 160px">
          <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
        </el-select>
        <el-slider v-model="filters.minScore" :min="0" :max="100" :step="10" style="width: 200px" />
        <span class="slider-label">最低契合度: {{ filters.minScore }}%</span>
        <el-button type="primary" @click="loadMatches">
          <el-icon><Refresh /></el-icon>刷新匹配
        </el-button>
      </div>

      <div v-if="matches.length" class="matches-list">
        <div v-for="match in filteredMatches" :key="match.userId" class="match-card">
          <div class="match-header">
            <el-avatar :src="match.user.avatar" :size="64" />
            <div class="match-user-info">
              <div class="match-name-row">
                <span class="match-name">{{ match.user.username }}</span>
                <span class="score-badge" :class="getScoreClass(match.score)">
                  {{ match.score }}% 契合
                </span>
              </div>
              <div class="match-rating">
                <el-rate :model-value="match.user.rating" disabled />
                <span class="rating-text">{{ match.user.rating }}</span>
                <span class="exchange-count">交换 {{ match.user.exchangeCount || 0 }} 次</span>
              </div>
              <div class="match-bio">{{ match.user.bio || '这个人很懒，什么都没写' }}</div>
            </div>
            <div class="match-score-circle" :class="getScoreClass(match.score)">
              <span class="score-number">{{ match.score }}</span>
              <span class="score-label">契合度</span>
            </div>
          </div>

          <div class="match-skills-section">
            <div class="skill-column">
              <h4 class="column-title">📖 你可以学到</h4>
              <div class="skills-tags">
                <span v-for="skill in match.matchedSkills.iCanLearn" :key="skill" class="skill-tag skill-learn">
                  {{ skill }}
                </span>
              </div>
            </div>
            <div class="skill-divider">
              <el-icon><Switch /></el-icon>
            </div>
            <div class="skill-column">
              <h4 class="column-title">🎓 你可以教授</h4>
              <div class="skills-tags">
                <span v-for="skill in match.matchedSkills.iCanTeach" :key="skill" class="skill-tag skill-teach">
                  {{ skill }}
                </span>
              </div>
            </div>
          </div>

          <div v-if="match.portfolios && match.portfolios.length > 0" class="portfolio-section">
            <h4 class="column-title portfolio-title">📁 作品集证明</h4>
            <div class="portfolio-preview">
              <div
                v-for="pf in match.portfolios.slice(0, 3)"
                :key="pf.id"
                class="portfolio-preview-item"
                @click="showPortfolioDetail(match, pf)"
              >
                <div class="pf-header">
                  <span class="pf-title">{{ pf.title }}</span>
                  <div class="pf-tag-group">
                    <el-tag size="small" type="info" effect="plain">{{ pf.skillName || '未知技能' }}</el-tag>
                    <el-tag size="small" type="warning">{{ pf.teachingStage }}</el-tag>
                  </div>
                </div>
                <div v-if="pf.link" class="pf-link">
                  <el-icon><Link /></el-icon>
                  <span>{{ pf.link }}</span>
                </div>
                <div v-if="pf.description" class="pf-desc">{{ pf.description }}</div>
              </div>
              <div v-if="match.portfolios.length > 3" class="portfolio-more">
                还有 {{ match.portfolios.length - 3 }} 个案例...
              </div>
            </div>
          </div>

          <div class="match-actions">
            <el-button @click="goToProfile(match.userId)">
              <el-icon><User /></el-icon>查看主页
            </el-button>
            <el-button type="primary" @click="goToChat(match.userId)">
              <el-icon><ChatDotRound /></el-icon>开始聊天
            </el-button>
            <el-button type="success" @click="createExchange(match)">
              <el-icon><Promotion /></el-icon>发起交换
            </el-button>
          </div>
        </div>
      </div>

      <el-empty v-else description="暂无匹配，先去发布你的技能吧">
        <template #action>
          <el-button type="primary" @click="$router.push('/publish')">发布技能</el-button>
        </template>
      </el-empty>
    </div>

    <el-dialog v-model="showPortfolioDialog" title="作品集详情" width="600px">
      <div v-if="selectedPortfolio" class="portfolio-detail">
        <div class="detail-header">
          <h3 class="detail-title">{{ selectedPortfolio.title }}</h3>
          <div class="detail-tags">
            <el-tag type="info" effect="plain">{{ selectedPortfolio.skillName || '未知技能' }}</el-tag>
            <el-tag type="warning">{{ selectedPortfolio.teachingStage }}</el-tag>
            <el-tag type="success">公开</el-tag>
          </div>
        </div>
        <div v-if="selectedPortfolio.link" class="detail-link">
          <el-icon><Link /></el-icon>
          <a :href="selectedPortfolio.link" target="_blank">{{ selectedPortfolio.link }}</a>
        </div>
        <div v-if="selectedPortfolio.description" class="detail-desc">
          <h4>案例说明</h4>
          <p>{{ selectedPortfolio.description }}</p>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="showExchangeDialog" title="发起技能交换" width="600px">
      <div v-if="currentMatch" class="exchange-confirm">
        <div class="exchange-users">
          <el-avatar :src="currentMatch.user.avatar" :size="56" />
          <div class="exchange-user-info">
            <div class="exchange-username">{{ currentMatch.user.username }}</div>
            <div class="exchange-score">
              <el-rate :model-value="currentMatch.user.rating" disabled size="small" />
              <span>{{ currentMatch.user.rating }}</span>
            </div>
          </div>
        </div>

        <div class="exchange-skills">
          <div class="exchange-skill-col">
            <span class="label">你将教授:</span>
            <div class="skills-tags">
              <span
                v-for="skill in currentMatch.matchedSkills.iCanTeach"
                :key="skill"
                class="skill-tag skill-teach"
              >
                {{ skill }}
              </span>
            </div>
          </div>
          <div class="exchange-skill-col">
            <span class="label">你将学习:</span>
            <div class="skills-tags">
              <span
                v-for="skill in currentMatch.matchedSkills.iCanLearn"
                :key="skill"
                class="skill-tag skill-learn"
              >
                {{ skill }}
              </span>
            </div>
          </div>
        </div>

        <div v-if="currentMatch.portfolios && currentMatch.portfolios.length > 0" class="exchange-portfolios">
          <h4 class="subsection-title">📁 对方的作品集证明（{{ currentMatch.portfolios.length }}个案例）</h4>
          <div class="exchange-portfolio-list">
            <div
              v-for="pf in currentMatch.portfolios"
              :key="pf.id"
              class="exchange-portfolio-item"
            >
              <div class="ep-header">
                <span class="ep-title">{{ pf.title }}</span>
                <div class="ep-tag-group">
                  <el-tag size="small" type="info" effect="plain">{{ pf.skillName || '未知技能' }}</el-tag>
                  <el-tag size="small" type="warning">{{ pf.teachingStage }}</el-tag>
                </div>
              </div>
              <div v-if="pf.link" class="ep-link">
                <el-icon><Link /></el-icon>
                <a :href="pf.link" target="_blank">{{ pf.link }}</a>
              </div>
              <div v-if="pf.description" class="ep-desc">{{ pf.description }}</div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showExchangeDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmExchange" :loading="exchanging">
          确认发起交换
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { matchAPI, skillAPI, exchangeAPI } from '../api'
import { ElMessage } from 'element-plus'
import { Search, Refresh, User, ChatDotRound, Switch, Promotion, Link } from '@element-plus/icons-vue'

const router = useRouter()
const matches = ref([])
const categories = ref([])
const showPortfolioDialog = ref(false)
const selectedPortfolio = ref(null)
const showExchangeDialog = ref(false)
const currentMatch = ref(null)
const exchanging = ref(false)
const filters = ref({
  keyword: '',
  category: '',
  minScore: 30
})

const filteredMatches = computed(() => {
  let result = matches.value
  if (filters.value.keyword) {
    const keyword = filters.value.keyword.toLowerCase()
    result = result.filter(m =>
      m.matchedSkills.iCanLearn.some(s => s.toLowerCase().includes(keyword)) ||
      m.matchedSkills.iCanTeach.some(s => s.toLowerCase().includes(keyword)) ||
      m.user.username.toLowerCase().includes(keyword)
    )
  }
  return result
})

onMounted(async () => {
  await loadCategories()
  await loadMatches()
})

async function loadCategories() {
  const res = await skillAPI.getCategories()
  categories.value = res.data
}

async function loadMatches() {
  try {
    const params = { minScore: filters.value.minScore }
    if (filters.value.category) params.category = filters.value.category
    const res = await matchAPI.getMatches(params)
    matches.value = res.data
  } catch (e) {
    ElMessage.error('加载匹配失败')
  }
}

function getScoreClass(score) {
  if (score >= 70) return 'score-high'
  if (score >= 40) return 'score-medium'
  return 'score-low'
}

function goToProfile(userId) {
  router.push(`/profile/${userId}`)
}

function goToChat(userId) {
  router.push(`/chat/${userId}`)
}

async function createExchange(match) {
  currentMatch.value = match
  showExchangeDialog.value = true
}

async function confirmExchange() {
  if (!currentMatch.value) return
  try {
    exchanging.value = true
    await exchangeAPI.createExchange({
      partnerId: currentMatch.value.userId,
      skills: {
        teach: currentMatch.value.matchedSkills.iCanTeach,
        learn: currentMatch.value.matchedSkills.iCanLearn
      }
    })
    ElMessage.success('交换请求已发送')
    showExchangeDialog.value = false
  } catch (e) {
    ElMessage.error('发起交换失败')
  } finally {
    exchanging.value = false
  }
}

function showPortfolioDetail(match, portfolio) {
  selectedPortfolio.value = portfolio
  showPortfolioDialog.value = true
}
</script>

<style scoped>
.matches {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
  flex-wrap: wrap;
}

.slider-label {
  font-size: 14px;
  color: #666;
}

.matches-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.match-card {
  background: #fafafa;
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.match-card:hover {
  border-color: #667eea;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.15);
}

.match-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
}

.match-user-info {
  flex: 1;
}

.match-name-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.match-name {
  font-size: 20px;
  font-weight: 700;
  color: #333;
}

.match-rating {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.rating-text {
  font-weight: 600;
  color: #ff9800;
}

.exchange-count {
  color: #999;
  font-size: 13px;
}

.match-bio {
  color: #666;
  font-size: 14px;
}

.match-score-circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
}

.score-number {
  font-size: 32px;
  font-weight: 700;
}

.score-label {
  font-size: 12px;
}

.match-skills-section {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  margin-bottom: 20px;
}

.skill-column {
  flex: 1;
}

.column-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.skills-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.skill-divider {
  font-size: 32px;
  color: #667eea;
}

.match-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.portfolio-section {
  margin-bottom: 20px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  border: 1px dashed #e0e0e0;
}

.portfolio-title {
  margin-bottom: 12px;
}

.portfolio-preview {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.portfolio-preview-item {
  padding: 12px;
  background: #f5f7ff;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.portfolio-preview-item:hover {
  background: #e8ebff;
  transform: translateX(4px);
}

.pf-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 6px;
  gap: 8px;
}

.pf-title {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.pf-tag-group,
.ep-tag-group {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.pf-link {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #667eea;
  margin-bottom: 4px;
}

.pf-link span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 300px;
}

.pf-desc {
  font-size: 12px;
  color: #666;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.portfolio-more {
  text-align: center;
  color: #999;
  font-size: 13px;
  padding: 8px;
}

.portfolio-detail .detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  gap: 12px;
}

.portfolio-detail .detail-title {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.portfolio-detail .detail-tags {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.portfolio-detail .detail-link {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  padding: 12px;
  background: #f5f7ff;
  border-radius: 8px;
}

.portfolio-detail .detail-link a {
  color: #667eea;
  text-decoration: none;
  word-break: break-all;
}

.portfolio-detail .detail-link a:hover {
  text-decoration: underline;
}

.portfolio-detail .detail-desc h4 {
  margin: 0 0 8px 0;
  font-size: 15px;
  color: #333;
}

.portfolio-detail .detail-desc p {
  margin: 0;
  color: #666;
  line-height: 1.8;
}

.exchange-confirm {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.exchange-users {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #fafafa;
  border-radius: 12px;
}

.exchange-user-info {
  flex: 1;
}

.exchange-username {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.exchange-score {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #ff9800;
  font-weight: 600;
}

.exchange-skills {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding: 16px;
  background: #fafafa;
  border-radius: 12px;
}

.exchange-skill-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.exchange-skill-col .label {
  font-size: 13px;
  font-weight: 600;
  color: #666;
}

.exchange-portfolios {
  padding: 16px;
  background: #f5f7ff;
  border-radius: 12px;
  border: 1px dashed #c5cae9;
}

.exchange-portfolios .subsection-title {
  margin-bottom: 12px;
  font-size: 15px;
}

.exchange-portfolio-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 300px;
  overflow-y: auto;
}

.exchange-portfolio-item {
  padding: 12px;
  background: white;
  border-radius: 8px;
}

.ep-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 6px;
  gap: 8px;
}

.ep-title {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.ep-link {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #667eea;
  margin-bottom: 4px;
}

.ep-link a {
  color: #667eea;
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 350px;
}

.ep-link a:hover {
  text-decoration: underline;
}

.ep-desc {
  font-size: 12px;
  color: #666;
  line-height: 1.5;
}
</style>
