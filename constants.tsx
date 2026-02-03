
import React from 'react';
import { 
  Home, 
  Calendar, 
  Activity, 
  BookOpen, 
  BarChart3,
  Droplets,
  Heart,
  Brain,
  Coffee,
  Moon
} from 'lucide-react';

export const SYMPTOMS_LIST = [
  { name: '头晕', icon: <Brain className="w-5 h-5" /> },
  { name: '绞痛', icon: <Activity className="w-5 h-5" /> },
  { name: '疲劳', icon: <Coffee className="w-5 h-5" /> },
  { name: '腰疼', icon: <Activity className="w-5 h-5" /> },
  { name: '情绪波动', icon: <Heart className="w-5 h-5" /> },
  { name: '乳房胀痛', icon: <Activity className="w-5 h-5" /> },
  { name: '腹胀', icon: <Activity className="w-5 h-5" /> },
  { name: '粉刺', icon: <Activity className="w-5 h-5" /> }
];

export const MOCK_ARTICLES = [
  {
    id: '1',
    title: '经期痛经怎么办？科学止痛指南',
    excerpt: '不仅仅是多喝热水，了解真正的生理机制与应对措施。',
    category: '经期知识',
    date: '2024-05-20',
    imageUrl: 'https://picsum.photos/seed/period/400/200'
  },
  {
    id: '2',
    title: '关于避孕，你应该知道的真相',
    excerpt: '科学避孕不仅是保护，更是对自己身体的尊重。',
    category: '两性健康',
    date: '2024-05-18',
    imageUrl: 'https://picsum.photos/seed/health/400/200'
  },
  {
    id: '3',
    title: '月经周期中的情绪过山车',
    excerpt: '了解黄体期激素变化对心理的影响，学会与情绪和解。',
    category: '心理调适',
    date: '2024-05-15',
    imageUrl: 'https://picsum.photos/seed/mood/400/200'
  }
];
