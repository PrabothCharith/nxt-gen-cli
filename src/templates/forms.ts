export const profileFormExample = `
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

const formSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
})

export function ProfileForm() {
    // 1. Define your form.
    const form = useForm<z.infer<typeof formSchema>>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        username: "",
      },
    })
   
    // 2. Define a submit handler.
    function onSubmit(values: z.infer<typeof formSchema>) {
      // Do something with the form values.
      // ✅ This will be type-safe and validated.
      console.log(values)
    }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-md mx-auto p-4 border rounded-lg">
      <div className="flex flex-col gap-2">
        <label htmlFor="username" className="font-medium">Username</label>
        <input 
            {...form.register("username")}
            placeholder="shadcn" 
            className="p-2 border rounded-md"
        />
        {form.formState.errors.username && (
            <span className="text-red-500 text-sm">{form.formState.errors.username.message}</span>
        )}
      </div>
      
      <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-md bg-black text-white hover:opacity-90">
        Submit
      </button>
    </form>
  )
}
`;
