import { z } from 'zod';

export const VerdictSchema = z.enum(['PASS', 'FAIL', 'BLOCKED', 'NEEDS_REVIEW']);
export type Verdict = z.infer<typeof VerdictSchema>;

export const PrioritySchema = z.enum(['Alta', 'Média', 'Baixa']);
export type Priority = z.infer<typeof PrioritySchema>;

export const ModeSchema = z.enum(['polidor', 'video', 'autonomo']);
export type Mode = z.infer<typeof ModeSchema>;

export const TestCaseStepSchema = z.object({
  id: z.string().uuid(),
  action: z.string().min(1).max(2000),
  expected: z.string().min(1).max(2000),
});
export type TestCaseStep = z.infer<typeof TestCaseStepSchema>;

export const TestCaseVersionSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  source: z.enum(['manual', 'ai-polished', 'ai-video', 'imported']),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).default(''),
  preconditions: z.string().max(2000).default(''),
  priority: PrioritySchema,
  tags: z.array(z.string().min(1).max(40)).max(20).default([]),
  environment: z.string().max(80).default('homologação'),
  mode: ModeSchema,
  verdict: VerdictSchema,
  steps: z.array(TestCaseStepSchema).min(1).max(50),
  spec: z.string().optional(),
});
export type TestCaseVersion = z.infer<typeof TestCaseVersionSchema>;

const TestCaseRecordSchema = z.object({
  id: z.string().uuid(),
  currentVersionId: z.string().uuid(),
  versions: z.array(TestCaseVersionSchema).min(1),
  folderId: z.string().uuid().nullable(),
  projectId: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const TestCaseSchema = TestCaseRecordSchema.refine((tc) => tc.versions.some((v) => v.id === tc.currentVersionId), {
  message: 'A versão atual deve pertencer ao caso de teste.',
  path: ['currentVersionId'],
});
export type TestCase = z.infer<typeof TestCaseSchema>;

export const FolderSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(80),
  parentId: z.string().uuid().nullable(),
  projectId: z.string().uuid(),
});
export type Folder = z.infer<typeof FolderSchema>;

export const ProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(80),
  description: z.string().max(500).optional(),
});
export type Project = z.infer<typeof ProjectSchema>;

export const FileAttachmentSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  size: z.number().int().nonnegative(),
  mimeType: z.string().min(1).max(120),
  url: z.string(),
  kind: z.enum(['video', 'image', 'document', 'other']),
});
export type FileAttachment = z.infer<typeof FileAttachmentSchema>;

export const ChatMessageSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(['user', 'agent']),
  text: z.string(),
  attachments: z.array(FileAttachmentSchema).optional(),
  testCaseId: z.string().uuid().optional(),
  createdAt: z.string().datetime(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ConversationSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  folderId: z.string().uuid().nullable(),
  title: z.string().min(1).max(200),
  pinned: z.boolean(),
  pinnedAt: z.string().datetime().nullable(),
  updatedAt: z.string().datetime(),
  messages: z.array(ChatMessageSchema),
});
export type Conversation = z.infer<typeof ConversationSchema>;


// Stored drafts can be incomplete, and releases before UUID support used short IDs.
// Validate their structure without discarding text entered during an edit.
const StoredIdSchema = z.string().min(1);
const StoredStepSchema = TestCaseStepSchema.extend({
  id: StoredIdSchema,
  action: z.string(),
  expected: z.string(),
});
const StoredVersionSchema = TestCaseVersionSchema.extend({
  id: StoredIdSchema,
  title: z.string(),
  description: z.string().default(''),
  preconditions: z.string().default(''),
  environment: z.string().default('homologação'),
  tags: z.array(z.string()).default([]),
  steps: z.array(StoredStepSchema).min(1),
});
export const StoredTestCaseSchema = TestCaseRecordSchema.extend({
  id: StoredIdSchema,
  projectId: StoredIdSchema,
  folderId: StoredIdSchema.nullable(),
  currentVersionId: z.string(),
  versions: z.array(StoredVersionSchema).min(1),
}).transform((tc) => ({
  ...tc,
  currentVersionId: tc.versions.some((v) => v.id === tc.currentVersionId)
    ? tc.currentVersionId : tc.versions[tc.versions.length - 1]!.id,
}));
export const StoredProjectSchema = ProjectSchema.extend({ id: StoredIdSchema, name: z.string(), description: z.string().optional() });
export const StoredFolderSchema = FolderSchema.extend({ id: StoredIdSchema, name: z.string(), parentId: StoredIdSchema.nullable(), projectId: StoredIdSchema });
export const StoredConversationSchema = ConversationSchema.extend({
  id: StoredIdSchema,
  projectId: StoredIdSchema,
  folderId: StoredIdSchema.nullable(),
  title: z.string(),
  messages: z.array(ChatMessageSchema.extend({
    id: StoredIdSchema,
    testCaseId: StoredIdSchema.optional(),
    attachments: z.array(FileAttachmentSchema.extend({ id: StoredIdSchema })).optional(),
  })),
});
