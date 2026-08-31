import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ArticleEditorScreen from './src/screens/ArticleEditorScreen';
import SelectCategoryScreen from './src/screens/SelectCategoryScreen';
import AddTagsScreen from './src/screens/AddTagsScreen';
import AIHelperScreen from './src/screens/AIHelperScreen';
import BlogDetailScreen from './src/screens/social/BlogDetailScreen';
import { blogsService } from './src/services/api/blogs.service';
import { coachService } from './src/services/api/coach.service';
import { postsService } from './src/services/api/posts.service';

const SAMPLE_BODY = 'Loaded existing article body for editing.';

let nextId = 1;
const store: Record<string, any> = {
  'article-1': {
    id: 'article-1', blog_id: 'blog-1', title: 'Existing Draft',
    body: SAMPLE_BODY, cover: '', category: 'weight', tags: ['motivation', 'progress'],
    status: 'draft', views: 0, earned: 0, read_minutes: 1, created_at: new Date().toISOString(),
  },
};

(blogsService as any).getArticle = async (id: string) => {
  console.log('[MOCK] getArticle', id);
  return store[id];
};
(blogsService as any).createArticle = async (value: any) => {
  const id = `new-${nextId++}`;
  console.log('[MOCK] createArticle', JSON.stringify(value));
  store[id] = { id, blog_id: value.blogId, title: value.title, body: value.body, cover: value.cover || '', category: value.category, tags: value.tags || [], status: value.status || 'draft', views: 0, earned: 0, read_minutes: 1, created_at: new Date().toISOString() };
  return store[id];
};
(blogsService as any).updateArticle = async (id: string, value: any) => {
  console.log('[MOCK] updateArticle', id, JSON.stringify(value));
  store[id] = { ...store[id], ...value };
  return store[id];
};

(postsService as any).uploadImage = async () => {
  console.log('[MOCK] uploadImage');
  return 'https://picsum.photos/seed/teamcal/800/400';
};

(coachService as any).generateArticleContent = async (value: any) => {
  console.log('[MOCK] generateArticleContent', JSON.stringify(value));
  if (value.action === 'titles') {
    return { success: true, action: value.action, titles: ['5 Ways to Boost Your Morning Routine', 'The Science Behind Better Sleep', 'Why Consistency Beats Motivation'] };
  }
  return { success: true, action: value.action, text: `Mock AI response for action "${value.action}" about "${value.topic}". **Bold sample** and a normal sentence to insert into the article.` };
};

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="ArticleEditor">
            <Stack.Screen name="ArticleEditor" component={ArticleEditorScreen} initialParams={{ blogId: 'blog-1' }} />
            <Stack.Screen name="SelectCategory" component={SelectCategoryScreen} options={{ presentation: 'modal' }} />
            <Stack.Screen name="AddTags" component={AddTagsScreen} options={{ presentation: 'modal' }} />
            <Stack.Screen name="AIHelper" component={AIHelperScreen} options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen name="BlogDetail" component={BlogDetailScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
