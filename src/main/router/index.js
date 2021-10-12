import Vue from 'vue';
import VueRouter from 'vue-router';
Vue.use(VueRouter);
export default new VueRouter({
    routes: [
        {
            path: '/',
            name: 'landing-page',
            component: require('@/components/LandingPage').default
        },
        {
            path: '*',
            redirect: '/'
        }
    ]
});
//# sourceMappingURL=index.js.map