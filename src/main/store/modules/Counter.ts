const state = {
  main: 0
}

const getters = {
}

const mutations = {
  DECREMENT_MAIN_COUNTER (state: { main: number }) {
    state.main--
  },
  INCREMENT_MAIN_COUNTER (state: { main: number }) {
    state.main++
  }
}

const actions = {
}

export default {
  state,
  getters,
  mutations,
  actions
}
