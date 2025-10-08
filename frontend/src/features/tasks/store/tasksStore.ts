import { create } from 'zustand'
import type { Task, TaskStatus } from '@/shared/types'

interface TasksStore {
  tasks: Task[]
  selectedTask: Task | null
  isLoading: boolean
  error: string | null
  filterStatus: TaskStatus | 'all' | null

  setTasks: (tasks: Task[]) => void
  addTask: (task: Task) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  selectTask: (task: Task | null) => void
  setFilterStatus: (status: TaskStatus | 'all' | null) => void

  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useTasksStore = create<TasksStore>((set) => ({
  tasks: [],
  selectedTask: null,
  isLoading: false,
  error: null,
  filterStatus: null,

  setTasks: (tasks) => set({ tasks }),

  addTask: (task) => set((state) => ({
    tasks: [task, ...state.tasks]
  })),

  updateTask: (id, updates) => set((state) => ({
    tasks: state.tasks.map((task) =>
      task.id === id ? { ...task, ...updates } : task
    ),
  })),

  deleteTask: (id) => set((state) => ({
    tasks: state.tasks.filter((task) => task.id !== id),
  })),

  selectTask: (task) => set({ selectedTask: task }),
  setFilterStatus: (status) => set({ filterStatus: status }),

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}))
