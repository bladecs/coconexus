'use strict';

function sanitizeUser(userInstance) {
  if (!userInstance) {
    return null;
  }

  const user = userInstance.toJSON ? userInstance.toJSON() : userInstance;

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    created_at: user.created_at,
    updated_at: user.updated_at,
    profile: user.profile
      ? {
          user_id: user.profile.user_id,
          full_name: user.profile.full_name,
          bio: user.profile.bio,
          avatar_url: user.profile.avatar_url,
          job_title: user.profile.job_title,
          department: user.profile.department,
          division: user.profile.division,
        }
      : null,
  };
}

function sanitizeComment(commentInstance) {
  if (!commentInstance) {
    return null;
  }

  const comment = commentInstance.toJSON ? commentInstance.toJSON() : commentInstance;

  return {
    id: comment.id,
    body: comment.body,
    status: comment.status,
    user_id: comment.user_id,
    article_id: comment.article_id,
    parent_id: comment.parent_id,
    created_at: comment.created_at,
    updated_at: comment.updated_at,
    user: comment.user
      ? {
          id: comment.user.id,
          email: comment.user.email,
          role: comment.user.role,
          profile: comment.user.profile
            ? {
                user_id: comment.user.profile.user_id,
                full_name: comment.user.profile.full_name,
                bio: comment.user.profile.bio,
                avatar_url: comment.user.profile.avatar_url,
                job_title: comment.user.profile.job_title,
                department: comment.user.profile.department,
                division: comment.user.profile.division,
              }
            : null,
        }
      : null,
    replies: Array.isArray(comment.replies) ? comment.replies.map(sanitizeComment) : [],
  };
}

function buildCommentTree(commentInstances) {
  const plainComments = commentInstances.map((comment) => sanitizeComment(comment));
  const byId = new Map();
  const roots = [];

  plainComments.forEach((comment) => {
    comment.replies = [];
    byId.set(comment.id, comment);
  });

  plainComments.forEach((comment) => {
    if (comment.parent_id && byId.has(comment.parent_id)) {
      byId.get(comment.parent_id).replies.push(comment);
      return;
    }

    if (!comment.parent_id) {
      roots.push(comment);
    }
  });

  return roots;
}

function sanitizeArticle(articleInstance, options = {}) {
  const { includeComments = true } = options;

  if (!articleInstance) {
    return null;
  }

  const article = articleInstance.toJSON ? articleInstance.toJSON() : articleInstance;

  return {
    id: article.id,
    author_id: article.author_id,
    category_id: article.category_id,
    parent_article_id: article.parent_article_id,
    article_type: article.parent_article_id ? 'detail' : 'main',
    title: article.title,
    version: article.version,
    status: article.status,
    created_at: article.created_at,
    updated_at: article.updated_at,
    author: article.author
      ? {
          id: article.author.id,
          email: article.author.email,
          role: article.author.role,
          profile: article.author.profile
            ? {
                user_id: article.author.profile.user_id,
                full_name: article.author.profile.full_name,
                bio: article.author.profile.bio,
                avatar_url: article.author.profile.avatar_url,
                job_title: article.author.profile.job_title,
                department: article.author.profile.department,
                division: article.author.profile.division,
              }
            : null,
        }
      : null,
    category: article.category
      ? {
          id: article.category.id,
          name: article.category.name,
          description: article.category.description,
          created_at: article.category.created_at,
          updated_at: article.category.updated_at,
        }
      : null,
    tags: Array.isArray(article.tags) ? article.tags.map((tag) => tag.name) : [],
    parent_article: article.parentArticle
      ? {
          id: article.parentArticle.id,
          title: article.parentArticle.title,
          category_id: article.parentArticle.category_id,
          status: article.parentArticle.status,
        }
      : null,
    detail: article.detail
      ? {
          id: article.detail.id,
          article_id: article.detail.article_id,
          body_content: article.detail.body_content,
          meta_description: article.detail.meta_description,
          sections: Array.isArray(article.detail.sections) ? article.detail.sections : [],
          sources: Array.isArray(article.detail.sources) ? article.detail.sources : [],
          created_at: article.detail.created_at,
          updated_at: article.detail.updated_at,
        }
      : null,
    media: Array.isArray(article.media)
      ? article.media.map((media) => ({
          id: media.id,
          article_id: media.article_id,
          file_path: media.file_path,
          media_type: media.media_type,
          created_at: media.created_at,
          updated_at: media.updated_at,
        }))
      : [],
    product_cards: Array.isArray(article.productCards)
      ? article.productCards.map((productCard) => ({
          id: productCard.id,
          article_id: productCard.article_id,
          title: productCard.title,
          description: productCard.description,
          image: productCard.image,
          linked_article_id: productCard.linked_article_id,
          linked_article: productCard.linkedArticle
            ? {
                id: productCard.linkedArticle.id,
                title: productCard.linkedArticle.title,
                status: productCard.linkedArticle.status,
              }
            : null,
          created_at: productCard.created_at,
          updated_at: productCard.updated_at,
        }))
      : [],
    linked_product_card: article.linkedProductCard
      ? {
          id: article.linkedProductCard.id,
          article_id: article.linkedProductCard.article_id,
          title: article.linkedProductCard.title,
          description: article.linkedProductCard.description,
          image: article.linkedProductCard.image,
          linked_article_id: article.linkedProductCard.linked_article_id,
          linked_article: article.linkedProductCard.linkedArticle
            ? {
                id: article.linkedProductCard.linkedArticle.id,
                title: article.linkedProductCard.linkedArticle.title,
                status: article.linkedProductCard.linkedArticle.status,
              }
            : null,
          created_at: article.linkedProductCard.created_at,
          updated_at: article.linkedProductCard.updated_at,
        }
      : null,
    comments:
      includeComments && Array.isArray(article.comments)
        ? buildCommentTree(article.comments)
        : undefined,
  };
}

module.exports = {
  sanitizeUser,
  sanitizeComment,
  buildCommentTree,
  sanitizeArticle,
};
