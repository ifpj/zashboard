import { isSingBox } from '@/api'
import { GLOBAL, PROXY_TAB_TYPE } from '@/constant'
import { isHiddenGroup } from '@/helper'
import { configs } from '@/store/config'
import {
  getProxyGroupChains,
  proxiesTabShow,
  proxyGroupList,
  proxyMap,
  proxyProviederList,
} from '@/store/proxies'
import { customGlobalNode, displayGlobalByMode, manageHiddenGroup } from '@/store/settings'
import { isEmpty } from 'lodash'
import { computed, ref } from 'vue'
import {
  isProxyNodeSearchMode,
  matchProxyGroupFilterProfile,
  matchProxySearchKeyword,
  proxyGroupContainsMatchingNode,
  proxyProviderContainsMatchingNode,
  proxySearchKeyword,
} from './proxySearch'

const filterProxyGroups = (groups: string[], respectHiddenGroups = true) => {
  let result = groups

  if (respectHiddenGroups && !manageHiddenGroup.value) {
    result = result.filter((name) => !isHiddenGroup(name))
  }

  result = result.filter(matchProxyGroupFilterProfile)

  if (!proxySearchKeyword.value) {
    return result
  }

  const matchesGroup = isProxyNodeSearchMode.value
    ? proxyGroupContainsMatchingNode
    : (name: string) => matchProxySearchKeyword(name)

  return result.filter(matchesGroup)
}

const getRenderProxyGroups = () => {
  if (isEmpty(proxyMap.value)) {
    return []
  }

  if (displayGlobalByMode.value) {
    if (configs.value?.mode.toUpperCase() === GLOBAL) {
      const globalName =
        isSingBox.value && proxyMap.value[customGlobalNode.value] ? customGlobalNode.value : GLOBAL

      return filterProxyGroups(getProxyGroupChains(globalName), false)
    }

    return filterProxyGroups(proxyGroupList.value)
  }

  return filterProxyGroups([...proxyGroupList.value, GLOBAL])
}

const getRenderProxyProviders = () => {
  const names = proxyProviederList.value.map((provider) => provider.name)

  if (!proxySearchKeyword.value) {
    return names
  }

  const matches = isProxyNodeSearchMode.value
    ? proxyProviderContainsMatchingNode
    : (name: string) => matchProxySearchKeyword(name)

  return names.filter(matches)
}

const limitInitialRender = (names: string[]) => {
  if (isProxiesPageMounted.value) {
    return names
  }

  return names.slice(0, 16)
}

export const disableProxiesPageScroll = ref(false)
export const isProxiesPageMounted = ref(false)

export const renderProxyGroups = computed(() => {
  return limitInitialRender(getRenderProxyGroups())
})

export const renderProxyProviders = computed(() => {
  return limitInitialRender(getRenderProxyProviders())
})

export const renderProxiesPageItems = computed(() => {
  if (proxiesTabShow.value === PROXY_TAB_TYPE.PROVIDER) {
    return renderProxyProviders.value
  }

  return renderProxyGroups.value
})
