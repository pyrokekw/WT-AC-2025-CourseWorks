import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { Article, Source, Tag } from '../shared/types';
import './FeedPage.css';

export default function FeedPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSource, setSelectedSource] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  useEffect(() => {
    fetchData();
  }, [selectedSource, selectedTag]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedSource) params.append('sourceId', selectedSource);
      if (selectedTag) params.append('tagId', selectedTag);

      const [articlesRes, sourcesRes, tagsRes] = await Promise.all([
        api.get(`/feed?${params}`),
        api.get('/sources'),
        api.get('/tags'),
      ]);

      setArticles(articlesRes.data.data.articles || []);
      setSources(sourcesRes.data.data.sources || []);
      setTags(tagsRes.data.data.tags || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div className="feed-page">
      <h1>Лента новостей</h1>
      
      <div className="filters">
        <div className="filter-group">
          <label htmlFor="source-filter">Источник:</label>
          <select
            id="source-filter"
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="form-input"
          >
            <option value="">Все источники</option>
            {sources.map((source) => (
              <option key={source.id} value={source.id}>
                {source.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="tag-filter">Тег:</label>
          <select
            id="tag-filter"
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="form-input"
          >
            <option value="">Все теги</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {articles.length === 0 ? (
        <p className="empty-state">Новости не найдены</p>
      ) : (
        <div className="articles-grid">
          {articles.map((article) => (
            <article key={article.id} className="article-card">
              <h2>
                <Link to={`/article/${article.id}`}>{article.title}</Link>
              </h2>
              <div className="article-meta">
                <span className="article-source">{article.source.name}</span>
                <span className="article-date">
                  {new Date(article.publishedAt).toLocaleDateString('ru-RU')}
                </span>
              </div>
              <div className="article-tags">
                {article.tags.map((tag) => (
                  <span key={tag.id} className="tag">
                    {tag.name}
                  </span>
                ))}
              </div>
              {article.content && (
                <p className="article-excerpt">
                  {article.content.substring(0, 150)}...
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
