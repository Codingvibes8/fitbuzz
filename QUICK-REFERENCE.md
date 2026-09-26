# FitFlow AI - Quick Reference & Code Snippets

## 🚀 Getting Started (5 minutes)

```bash
# 1. Install dependencies
npm install

# 2. Copy environment template
cp .env.example .env.local

# 3. Start development server
npm run dev

# 4. Open browser
# http://localhost:3000
```

## 🔐 Authentication Flow

### Sign Up / Login
Users can sign up or log in from the landing page. The app uses a mock authentication system that can be replaced with real authentication.

```typescript
// Using auth in components
import { useUser } from "@/lib/context/user-context";

export default function MyComponent() {
  const { user, login, signup, logout, isLoading } = useUser();
  
  if (!user) {
    return <AuthForm />;
  }
  
  return <Dashboard />;
}
```

## 💳 Subscription Management

### Check Subscription Tier
```typescript
import { useSubscription } from "@/lib/context/subscription-context";

export default function MyComponent() {
  const { currentTier, canAccess, upgradePlan } = useSubscription();
  
  // Check if user can access premium feature
  if (!canAccess("AI Coach")) {
    return <UpgradePrompt />;
  }
  
  // Upgrade plan
  const handleUpgrade = async () => {
    await upgradePlan("pro");
  };
  
  return <PremiumFeature />;
}
```

### Feature Gating Example
```typescript
// Check for specific features
const canGenerateWorkouts = canAccess("AI Coach");
const canAccessAnalytics = canAccess("Analytics");
const hasUnlimitedPlans = currentTier !== "free";
```

## 📊 Using Charts (Recharts)

### Bar Chart Example
```typescript
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { day: "Mon", calories: 420 },
  { day: "Tue", calories: 380 },
  { day: "Wed", calories: 520 },
];

export default function ActivityChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="day" stroke="#94a3b8" />
        <YAxis stroke="#94a3b8" />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1e293b",
            border: "1px solid #475569",
          }}
        />
        <Bar dataKey="calories" fill="#6366F1" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

## 🎨 Using shadcn Components

### Button Examples
```typescript
import { Button } from "@/components/ui/button";

// Default button
<Button>Click me</Button>

// Variants
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon">🔧</Button>

// Disabled
<Button disabled>Disabled</Button>

// With icon
import { Plus } from "lucide-react";
<Button>
  <Plus className="w-4 h-4 mr-2" />
  Add Workout
</Button>
```

### Card Examples
```typescript
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Workout Summary</CardTitle>
    <CardDescription>Your weekly activity</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Main content */}
  </CardContent>
  <CardFooter>
    {/* Footer content */}
  </CardFooter>
</Card>
```

## 🎯 Tailwind CSS Classes

### Custom Classes Available

```typescript
// Buttons
className="btn-primary"     // Gradient button
className="btn-secondary"   // Secondary button

// Glass effect
className="glass"           // Glass morphism card
className="glass-lg"        // Larger glass card

// Text
className="text-gradient"   // Gradient text

// Badges
className="badge-primary"   // Primary badge
className="badge-secondary" // Secondary badge

// Layout utilities
className="flex-center"     // Center flex
className="flex-between"    // Space between flex
className="absolute-center" // Center absolute

// Glow effects
className="glow-indigo"     // Indigo glow
className="glow-pink"       // Pink glow
```

### Responsive Breakpoints
```typescript
// Responsive grid
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"

// Mobile first padding
className="p-4 md:p-6 lg:p-8"

// Responsive text
className="text-2xl md:text-3xl lg:text-4xl"
```

## 🎬 Common Patterns

### Protected Route
```typescript
"use client";

import { useUser } from "@/lib/context/user-context";
import { redirect } from "next/navigation";

export default function ProtectedPage() {
  const { user } = useUser();
  
  if (!user) {
    redirect("/");
  }
  
  return <div>Protected content</div>;
}
```

### Feature Gated Component
```typescript
"use client";

import { useSubscription } from "@/lib/context/subscription-context";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PremiumFeature() {
  const { canAccess, currentTier } = useSubscription();
  
  if (!canAccess("AI Coach")) {
    return (
      <div className="p-8 text-center glass rounded-xl">
        <Lock className="w-12 h-12 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Premium Feature</h2>
        <p className="text-slate-400 mb-4">
          Upgrade to {currentTier === 'free' ? 'Pro' : 'Elite'} to access this.
        </p>
        <Button>Upgrade Now</Button>
      </div>
    );
  }
  
  return <div>Premium content here</div>;
}
```

### Data Display Card
```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export default function StatCard() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-400 mb-1">This Week</p>
            <p className="text-3xl font-bold">2,860</p>
            <p className="text-xs text-slate-500 mt-1">calories</p>
          </div>
          <TrendingUp className="w-8 h-8 text-pink-400" />
        </div>
      </CardContent>
    </Card>
  );
}
```

## 📝 Common Tasks

### Add a New Page
```typescript
// src/app/dashboard/new-feature/page.tsx
"use client";

import { useUser } from "@/lib/context/user-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function NewFeaturePage() {
  const { user } = useUser();
  
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">New Feature</h1>
      
      <Card>
        <div className="p-6">
          {/* Content here */}
        </div>
      </Card>
    </div>
  );
}
```

### Add a New Component
```typescript
// src/components/MyComponent.tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubscription } from "@/lib/context/subscription-context";

interface MyComponentProps {
  title: string;
  description?: string;
}

export function MyComponent({ title, description }: MyComponentProps) {
  const { canAccess } = useSubscription();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {description && <p className="text-slate-400">{description}</p>}
      </CardContent>
    </Card>
  );
}
```

### Use Icons
```typescript
import { 
  Heart,
  Zap,
  TrendingUp,
  Settings,
  Plus,
  Trash2,
  LogOut
} from "lucide-react";

// In JSX
<Heart className="w-5 h-5 text-red-400" />
<Zap className="w-6 h-6 text-yellow-400" />
```

## 🔗 Navigation

### Client-side Link
```typescript
import Link from "next/link";
import { Button } from "@/components/ui/button";

<Button asChild>
  <Link href="/dashboard/workouts">View Workouts</Link>
</Button>

// Or simple link
<Link href="/pricing" className="text-indigo-400 hover:text-indigo-300">
  View Pricing
</Link>
```

## 🧪 Testing Components

### Test a Component
```typescript
// __tests__/components/Button.test.tsx
import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders with text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });
});
```

## 📦 Installing Additional Packages

```bash
# Add motion animations
npm install framer-motion

# Add form handling
npm install react-hook-form

# Add API client
npm install axios

# Add date utilities
npm install date-fns

# Add notifications
npm install react-hot-toast
```

## 🎨 Customizing Theme

Edit `tailwind.config.ts`:

```typescript
theme: {
  extend: {
    colors: {
      "my-color": "#HEXCODE",
    },
    fontFamily: {
      sans: ["MyFont", "sans-serif"],
    },
  },
},
```

## 🚀 Performance Tips

1. **Use Image Component**
   ```typescript
   import Image from "next/image";
   <Image src="/pic.jpg" alt="Description" width={400} height={300} />
   ```

2. **Code Splitting**
   ```typescript
   import dynamic from "next/dynamic";
   const HeavyComponent = dynamic(() => import("@/components/Heavy"));
   ```

3. **Lazy Load Charts**
   ```typescript
   const Chart = dynamic(() => import("@/components/Chart"), {
     loading: () => <div>Loading chart...</div>
   });
   ```

## 💡 Pro Tips

- Use `suppressHydrationWarning` for SSR/Client mismatches
- Leverage Next.js caching with `revalidate`
- Use TypeScript strict mode for type safety
- Keep components small and focused
- Use context only for truly global state
- Use Tailwind's `@apply` for complex styles

## 🐛 Debugging

```typescript
// Enable detailed logging
console.log("User:", user);
console.log("Subscription:", currentTier);

// Use React DevTools browser extension
// Use Next.js DevTools (built-in)
```

## 📚 Helpful Links

- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Lucide Icons](https://lucide.dev)
- [Recharts](https://recharts.org)
- [React Documentation](https://react.dev)

---

**That's it!** You're ready to start building with FitFlow AI. Happy coding! 🚀
