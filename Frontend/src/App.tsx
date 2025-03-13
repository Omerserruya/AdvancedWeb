import { Routes, Route } from 'react-router-dom';
import { Feed } from './pages/Home';
import Layout from "./Layout";
import MyPosts from './pages/MyPosts';
import Profile from './pages/Profile';
import AddPost from './pages/AddPost';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Feed />} />
        <Route path="my-posts" element={<MyPosts />} />
        <Route path="profile" element={<Profile />} />
        <Route path="add-post" element={<AddPost />} />
      </Route>
    </Routes>
  );
}

// Removed placeholder components for MyPosts and Profile

export default App;
