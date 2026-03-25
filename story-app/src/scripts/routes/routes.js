import HomePage from '../pages/home/home-page.js';
import AboutPage from '../pages/about/about-page.js';
import LoginPage from '../pages/auth/login-page.js';
import RegisterPage from '../pages/auth/register-page.js';
import AddStoryPage from '../pages/add-story/add-story-page.js';
import DraftsPage from '../pages/drafts/drafts-page.js';

const routes = {
  '/': new HomePage(),
  '/about': new AboutPage(),
  '/login': new LoginPage(),
  '/register': new RegisterPage(),
  '/add': new AddStoryPage(),
  '/drafts': new DraftsPage(),
};

export default routes;