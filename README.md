# todo-nextjs

An implementation of [TodoMVC](https://todomvc.com/) built with Replicache, Next.js, and Supabase.

This sample uses the global version strategy, shared mutators, supabase for storage, and supabase's built-in realtime support for pokes.

# Develop

<ol>
 <li>Create a new project at supabase.com. <b>Take note of the database password when you setup.</b></li>
 <li>Set the following environment variables:
   <ul>
     <li><code>SUPABASE_DATABASE_PASSWORD</code>: The database password you created above.</li>
     <li><code>NEXT_PUBLIC_SUPABASE_URL</code>: The "project URL" from the supabase project's dashboard. Looks like <code>https://&lt;id&gt;.supabase.co</code>, where `id` is the project's unique ID.</li>
     <li><code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>: The "API Key" from the supabase project. Accessible on project dashboard.</li>
    </ul>
  </li>
  <li><code>npm run dev</code></li>
</ol>
