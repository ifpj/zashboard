import { PROXY_SEARCH_MODE, PROXY_TAB_TYPE } from '@/constant'
import { toSearchRegex } from '@/helper/search'
import {
  activeProxyGroupFilterId,
  DEFAULT_PROXY_GROUP_FILTER_ID,
  proxiesFilter,
  proxiesTabShow,
  proxyGroupFilterProfiles,
  proxyMap,
  proxyProviederList,
  type ProxyGroupFilterProfile,
} from '@/store/proxies'
import { proxyProviderSearchMode, proxySearchMode } from '@/store/settings'
import { computed } from 'vue'

export const proxySearchKeyword = computed(() => proxiesFilter.value.trim())

const getCurrentSearchMode = () =>
  proxiesTabShow.value === PROXY_TAB_TYPE.PROVIDER ? proxyProviderSearchMode : proxySearchMode

export const isProxyNodeSearchMode = computed(
  () => getCurrentSearchMode().value === PROXY_SEARCH_MODE.GLOBAL,
)

export const normalizedProxyGroupFilterProfiles = computed(() => {
  const profiles = proxyGroupFilterProfiles.value
  const defaultProfile = profiles.find((profile) => profile.id === DEFAULT_PROXY_GROUP_FILTER_ID)

  if (defaultProfile) {
    return profiles
  }

  return [
    {
      id: DEFAULT_PROXY_GROUP_FILTER_ID,
      name: 'Default',
      include: '',
      exclude: '',
    },
    ...profiles,
  ]
})

export const activeProxyGroupFilterProfile = computed<ProxyGroupFilterProfile>(() => {
  return (
    normalizedProxyGroupFilterProfiles.value.find(
      (profile) => profile.id === activeProxyGroupFilterId.value,
    ) ?? normalizedProxyGroupFilterProfiles.value[0]
  )
})

export const toggleProxySearchMode = () => {
  const mode = getCurrentSearchMode()
  mode.value =
    mode.value === PROXY_SEARCH_MODE.GLOBAL ? PROXY_SEARCH_MODE.GROUP : PROXY_SEARCH_MODE.GLOBAL
}

export const matchProxySearchKeyword = (name: string, keyword = proxySearchKeyword.value) => {
  const normalizedKeyword = keyword.trim()

  if (!normalizedKeyword) {
    return true
  }

  return toSearchRegex(normalizedKeyword)?.test(name) ?? true
}

export const matchProxyGroupFilterProfile = (name: string) => {
  const { include, exclude } = activeProxyGroupFilterProfile.value
  const includeRules = splitRules(include)
  const excludeRules = splitRules(exclude)

  if (excludeRules.some((rule) => matchRule(name, rule))) {
    return false
  }

  if (!includeRules.length) {
    return true
  }

  return includeRules.some((rule) => matchRule(name, rule))
}

export const proxyGroupContainsMatchingNode = (groupName: string) => {
  return proxyMap.value[groupName]?.all?.some((name) => matchProxySearchKeyword(name)) ?? false
}

export const proxyProviderContainsMatchingNode = (providerName: string) => {
  const provider = proxyProviederList.value.find((p) => p.name === providerName)
  return provider?.proxies.some((node) => matchProxySearchKeyword(node.name)) ?? false
}

const splitRules = (rules: string) => {
  return rules
    .split(/[\s,\uFF0C]+/)
    .map((rule) => rule.trim())
    .filter(Boolean)
}

const matchRule = (name: string, rule: string) => {
  const regex = toSearchRegex(rule)

  if (regex) {
    return regex.test(name)
  }

  return name.toLowerCase().includes(rule.toLowerCase())
}
