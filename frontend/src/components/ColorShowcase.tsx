import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getStatusColor, getRoleColor, getUrgencyColor, getPriorityColor } from '@/lib/utils';

export const ColorShowcase: React.FC = () => {
  const statuses = ['Tiếp nhận văn bản', 'Đang xử lí', 'Xem xét', 'Hoàn thành'];
  const roles = ['Quản trị viên', 'Trưởng Công An Xã', 'Phó Công An Xã', 'Văn thư', 'Cán bộ'];
  const urgencies = ['critical', 'urgent', 'high', 'medium', 'normal'];
  const priorities = ['Cao', 'Trung bình', 'Thấp'];

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold">Enhanced Color Showcase</h1>
      
      {/* Button Variants */}
      <Card>
        <CardHeader>
          <CardTitle>Button Variants</CardTitle>
          <CardDescription>Updated button styles with enhanced gradients</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button>Default</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button variant="success">Success</Button>
          <Button variant="warning">Warning</Button>
        </CardContent>
      </Card>
      
      {/* Status Colors */}
      <Card>
        <CardHeader>
          <CardTitle>Status Colors</CardTitle>
          <CardDescription>Enhanced status color scheme with dark mode support</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {statuses.map((status) => (
            <span 
              key={status} 
              className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(status)}`}
            >
              {status}
            </span>
          ))}
        </CardContent>
      </Card>
      
      {/* Role Colors */}
      <Card>
        <CardHeader>
          <CardTitle>Role Colors</CardTitle>
          <CardDescription>Updated role color scheme with dark mode support</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {roles.map((role) => (
            <span 
              key={role} 
              className={`px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(role)}`}
            >
              {role}
            </span>
          ))}
        </CardContent>
      </Card>
      
      {/* Urgency Colors */}
      <Card>
        <CardHeader>
          <CardTitle>Urgency Colors</CardTitle>
          <CardDescription>Enhanced urgency color scheme with dark mode support</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {urgencies.map((urgency) => (
            <span 
              key={urgency} 
              className={`px-3 py-1 rounded-full text-sm font-medium border ${getUrgencyColor(urgency)}`}
            >
              {urgency}
            </span>
          ))}
        </CardContent>
      </Card>
      
      {/* Priority Colors */}
      <Card>
        <CardHeader>
          <CardTitle>Priority Colors</CardTitle>
          <CardDescription>New priority color scheme with dark mode support</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {priorities.map((priority) => (
            <span 
              key={priority} 
              className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(priority)}`}
            >
              {priority}
            </span>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};