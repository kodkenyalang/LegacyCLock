'use client';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLegacyClock } from '@/hooks/use-legacy-clock';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';

const beneficiarySchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
});

const assetSchema = z.object({
  description: z.string().min(3, 'Description is too short'),
  location: z.string().min(3, 'Location/hash is too short'),
});

const formSchema = z.object({
  content: z.string().min(10, 'Will content is too short.'),
  beneficiaries: z.array(beneficiarySchema).min(1, 'At least one beneficiary is required.'),
  assets: z.array(assetSchema).min(1, 'At least one asset is required.'),
  inactivityPeriodDays: z.coerce.number(),
});

type CreateWillFormValues = z.infer<typeof formSchema>;

interface CreateWillFormProps {
  onFinished: () => void;
}

export function CreateWillForm({ onFinished }: CreateWillFormProps) {
  const { createWill, isLoading } = useLegacyClock();
  const { toast } = useToast();

  const form = useForm<CreateWillFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: '',
      beneficiaries: [{ address: '' }],
      assets: [{ description: '', location: '' }],
      inactivityPeriodDays: 90,
    },
  });

  const { fields: beneficiaryFields, append: appendBeneficiary, remove: removeBeneficiary } = useFieldArray({
    control: form.control,
    name: 'beneficiaries',
  });

  const { fields: assetFields, append: appendAsset, remove: removeAsset } = useFieldArray({
    control: form.control,
    name: 'assets',
  });

  async function onSubmit(values: CreateWillFormValues) {
    try {
      await createWill(values);
      onFinished();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create the will. Please try again.',
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Will Content</FormLabel>
              <FormControl>
                <Textarea placeholder="I bequeath my digital assets as follows..." {...field} rows={5} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div>
          <FormLabel>Beneficiaries</FormLabel>
          <div className="space-y-2 pt-2">
            {beneficiaryFields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <FormField
                  control={form.control}
                  name={`beneficiaries.${index}.address`}
                  render={({ field }) => (
                    <FormItem className='flex-grow'>
                      <FormControl>
                        <Input placeholder="0x..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeBeneficiary(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => appendBeneficiary({ address: '' })}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Beneficiary
          </Button>
        </div>

        <div>
          <FormLabel>Digital Assets</FormLabel>
          <div className="space-y-4 pt-2">
            {assetFields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 p-4 border rounded-md relative">
                <div className='space-y-2'>
                    <FormField
                    control={form.control}
                    name={`assets.${index}.description`}
                    render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Asset Description (e.g., Crypto Wallet Seed)" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name={`assets.${index}.location`}
                    render={({ field }) => (
                        <FormItem>
                        <FormControl>
                            <Input placeholder="Location (e.g., IPFS hash, private note)" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                 <Button type="button" variant="ghost" size="icon" className="sm:self-center" onClick={() => removeAsset(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
           <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => appendAsset({ description: '', location: '' })}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Asset
          </Button>
        </div>

        <FormField
          control={form.control}
          name="inactivityPeriodDays"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Inactivity Period</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={String(field.value)}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a period" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="180">180 days</SelectItem>
                  <SelectItem value="365">365 days</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create & Encrypt Will
        </Button>
      </form>
    </Form>
  );
}
