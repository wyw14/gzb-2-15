<template>
  <div class="user-profile">
    <div v-if="user" class="card profile-header-card">
      <div class="profile-header">
        <el-avatar :src="user.avatar" :size="100" />
        <div class="profile-info">
          <h1 class="username">{{ user.username }}</h1>
          <div class="user-meta">
            <el-rate :model-value="user.rating" disabled />
            <span class="rating">{{ user.rating }}</span>
            <span class="divider">|</span>
            <span>{{ user.exchangeCount || 0 }} 次交换</span>
            <span class="divider">|</span>
            <span>{{ user.skillPoints || 0 }} 技能点</span>
          </div>
          <p class="bio">{{ user.bio || '这个人很懒，什么都没写' }}</p>
        </div>
        <div class="action-buttons">
          <el-button type="primary" @click="goToChat">
            <el-icon><ChatDotRound /></el-icon>发送消息
          </el-button>
        </div>
      </div>
    </div>

    <div v-if="user" class="profile-grid">
      <div class="card">
        <h2 class="section-title">🎓 技能</h2>
        <div class="skills-section">
          <div class="skill-type">
            <h3 class="subsection-title">可教</h3>
            <div class="skills-tags">
              <span
                v-for="skill in teachSkills"
                :key="skill.id"
                class="skill-tag skill-teach"
                @click="expandSkillPortfolios(skill.id)"
              >
                {{ skill.name }}
                <small>{{ skill.level }}</small>
                <small v-if="getSkillPortfolioCount(skill.id) > 0" class="portfolio-count">
                  📁{{ getSkillPortfolioCount(skill.id) }}
                </small>
              </span>
            </div>
            <el-empty v-if="teachSkills.length === 0" description="暂无" :image-size="60" />
          </div>
          <div class="skill-type">
            <h3 class="subsection-title">想学</h3>
            <div class="skills-tags">
              <span v-for="skill in learnSkills" :key="skill.id" class="skill-tag skill-learn">
                {{ skill.name }}
              </span>
            </div>
            <el-empty v-if="learnSkills.length === 0" description="暂无" :image-size="60" />
          </div>
        </div>

        <div v-if="user.portfolios && user.portfolios.length > 0" class="portfolio-section">
          <h3 class="subsection-title">📁 作品集证明</h3>
          <div class="portfolio-list">
            <div
              v-for="pf in user.portfolios"
              :key="pf.id"
              class="portfolio-card"
              :class="{ expanded: expandedPortfolio === pf.id }"
              @click="togglePortfolio(pf.id)"
            >
              <div class="portfolio-card-header">
                <span class="pf-title">{{ pf.title }}</span>
                <div class="pf-tags">
                  <el-tag size="small" type="info" effect="plain">{{ pf.skillName || getSkillName(pf.skillId) || '未知技能' }}</el-tag>
                  <el-tag size="small" type="warning">{{ pf.teachingStage }}</el-tag>
                </div>
              </div>
              <div v-if="pf.link" class="pf-link">
                <el-icon><Link /></el-icon>
                <a :href="pf.link" target="_blank" @click.stop>{{ pf.link }}</a>
              </div>
              <div v-if="expandedPortfolio === pf.id && pf.description" class="pf-desc">
                {{ pf.description }}
              </div>
              <div v-if="expandedPortfolio !== pf.id && pf.description" class="pf-desc-short">
                {{ pf.description.slice(0, 60) }}{{ pf.description.length > 60 ? '...' : '' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <h2 class="section-title">⭐ 评价</h2>
        <div v-if="reviews.length" class="reviews-list">
          <div v-for="review in reviews" :key="review.id" class="review-item">
            <div class="review-header">
              <el-avatar :src="review.reviewerAvatar" :size="40" />
              <div class="reviewer-info">
                <span class="reviewer-name">{{ review.reviewerName }}</span>
                <el-rate :model-value="review.rating" disabled size="small" />
              </div>
            </div>
            <p class="review-content">{{ review.comment }}</p>
          </div>
        </div>
        <el-empty v-else description="暂无评价" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authAPI, reviewAPI } from '../api'
import { Link } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const user = ref(null)
const reviews = ref([])
const expandedPortfolio = ref(null)

const teachSkills = computed(() => user.value?.skills?.filter(s => s.type === 'teach') || [])
const learnSkills = computed(() => user.value?.skills?.filter(s => s.type === 'learn') || [])

onMounted(async () => {
  await loadUser()
  await loadReviews()
})

async function loadUser() {
  try {
    const res = await authAPI.getUser(route.params.userId)
    user.value = res.data
  } catch (e) {}
}

async function loadReviews() {
  try {
    const res = await reviewAPI.getReviews(route.params.userId)
    reviews.value = res.data
  } catch (e) {}
}

function goToChat() {
  router.push(`/chat/${route.params.userId}`)
}

function togglePortfolio(id) {
  expandedPortfolio.value = expandedPortfolio.value === id ? null : id
}

function getSkillName(skillId) {
  const skill = user.value?.skills?.find(s => s.id === skillId)
  return skill?.name || ''
}

function getSkillPortfolioCount(skillId) {
  return user.value?.portfolios?.filter(p => p.skillId === skillId)?.length || 0
}

function expandSkillPortfolios(skillId) {
  const portfolio = user.value?.portfolios?.find(p => p.skillId === skillId)
  if (portfolio) {
    expandedPortfolio.value = expandedPortfolio.value === portfolio.id ? null : portfolio.id
  }
}
</script>

<style scoped>
.user-profile {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.profile-header-card {
  padding: 32px;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 24px;
}

.profile-info {
  flex: 1;
}

.username {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
}

.user-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #666;
  font-size: 14px;
  margin-bottom: 12px;
}

.rating {
  font-weight: 600;
  color: #ff9800;
}

.divider {
  color: #ddd;
}

.bio {
  color: #666;
  line-height: 1.6;
}

.profile-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.skills-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.skill-type {
  margin-bottom: 0;
}

.subsection-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.skills-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.skill-tag {
  cursor: pointer;
  transition: all 0.2s;
}

.skill-tag:hover {
  transform: translateY(-2px);
}

.skill-tag small {
  opacity: 0.8;
  margin-left: 4px;
}

.skill-tag .portfolio-count {
  background: rgba(255,255,255,0.3);
  padding: 1px 6px;
  border-radius: 10px;
  margin-left: 6px;
  font-size: 11px;
}

.portfolio-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #eee;
}

.portfolio-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.portfolio-card {
  padding: 16px;
  background: #fafafa;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid transparent;
}

.portfolio-card:hover {
  border-color: #667eea;
  background: #f5f7ff;
}

.portfolio-card.expanded {
  background: #f5f7ff;
  border-color: #667eea;
}

.portfolio-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 8px;
}

.pf-title {
  font-weight: 600;
  color: #333;
  font-size: 15px;
}

.pf-tags {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
  align-items: center;
}

.pf-skill-name {
  font-size: 12px;
  color: #667eea;
  background: #e8ebff;
  padding: 2px 8px;
  border-radius: 10px;
}

.pf-link {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  font-size: 13px;
  color: #667eea;
}

.pf-link a {
  color: #667eea;
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 350px;
}

.pf-link a:hover {
  text-decoration: underline;
}

.pf-desc,
.pf-desc-short {
  color: #666;
  font-size: 13px;
  line-height: 1.6;
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.review-item {
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
}

.review-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.reviewer-info {
  flex: 1;
}

.reviewer-name {
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 4px;
}

.review-content {
  color: #666;
  line-height: 1.6;
  margin: 0;
}
</style>
