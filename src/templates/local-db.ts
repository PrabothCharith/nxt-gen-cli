export const localDbFile = `
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data.json');

interface Post {
  id: number;
  title: string;
  content: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Data {
  posts: Post[];
}

// Ensure data file exists
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ posts: [] }, null, 2));
}

function readData(): Data {
  const data = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(data);
}

function writeData(data: Data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

export const db = {
  post: {
    findMany: async (args?: { where?: { OR?: Array<{ title?: { contains: string }, content?: { contains: string } }> }, orderBy?: { createdAt: 'desc' | 'asc' } }) => {
      const data = readData();
      let posts = data.posts;

      if (args?.where?.OR) {
        const searchTerms = args.where.OR;
        posts = posts.filter(post => 
          searchTerms.some(term => {
             if (term.title?.contains && post.title.toLowerCase().includes(term.title.contains.toLowerCase())) return true;
             if (term.content?.contains && post.content?.toLowerCase().includes(term.content.contains.toLowerCase())) return true;
             return false;
          })
        );
      }

      if (args?.orderBy?.createdAt === 'desc') {
        posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }

      return posts;
    },
    create: async (args: { data: { title: string; content?: string } }) => {
      const data = readData();
      const newPost: Post = {
        id: Date.now(),
        title: args.data.title,
        content: args.data.content || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      data.posts.push(newPost);
      writeData(data);
      return newPost;
    },
    update: async (args: { where: { id: number }; data: { title?: string; content?: string } }) => {
      const data = readData();
      const index = data.posts.findIndex(p => p.id === args.where.id);
      if (index === -1) throw new Error('Post not found');
      
      const updatedPost = {
        ...data.posts[index],
        ...args.data,
        updatedAt: new Date().toISOString(),
      };
      
      data.posts[index] = updatedPost;
      writeData(data);
      return updatedPost;
    },
    delete: async (args: { where: { id: number } }) => {
      const data = readData();
      const index = data.posts.findIndex(p => p.id === args.where.id);
      if (index === -1) throw new Error('Post not found');
      
      const deletedPost = data.posts[index];
      data.posts.splice(index, 1);
      writeData(data);
      return deletedPost;
    }
  }
};
`;
