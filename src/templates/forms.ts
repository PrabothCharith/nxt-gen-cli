export const formSchema = `import { z } from "zod";

export const contactFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  message: z.string().min(10, { message: "Message must be at least 10 characters." }),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;
`;

export const exampleForm = `import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactFormSchema, type ContactFormData } from "@/lib/schemas";

export function ContactForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    console.log("Form Data:", data);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    alert(JSON.stringify(data, null, 2));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md mx-auto border p-6 rounded-lg">
      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="text-sm font-medium">Name</label>
        <input
          {...register("name")}
          className="border p-2 rounded"
          placeholder="John Doe"
        />
        {errors.name && <span className="text-red-500 text-sm">{errors.name.message}</span>}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-medium">Email</label>
        <input
          {...register("email")}
          type="email"
          className="border p-2 rounded"
          placeholder="john@example.com"
        />
        {errors.email && <span className="text-red-500 text-sm">{errors.email.message}</span>}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="message" className="text-sm font-medium">Message</label>
        <textarea
          {...register("message")}
          className="border p-2 rounded"
          placeholder="Your message..."
        />
        {errors.message && <span className="text-red-500 text-sm">{errors.message.message}</span>}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-black text-white p-2 rounded hover:bg-gray-800 disabled:opacity-50"
      >
        {isSubmitting ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
`;
