import { z } from 'zod';

declare const DEFAULT_CHAT_MODEL = "gpt-5-mini";
declare const DEFAULT_CHAT_PROVIDER = "copilot";
declare const DEFAULT_ORCHESTRATOR_CLI_PROVIDER = "copilot";
declare const chatProviderCapabilitiesSchema: z.ZodObject<{
    supportsReasoningEffort: z.ZodDefault<z.ZodBoolean>;
    supportsSkills: z.ZodDefault<z.ZodBoolean>;
    supportsMcpServers: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
type ChatProviderCapabilities = z.infer<typeof chatProviderCapabilitiesSchema>;
declare const chatProviderDescriptorSchema: z.ZodObject<{
    id: z.ZodString;
    displayName: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    capabilities: z.ZodObject<{
        supportsReasoningEffort: z.ZodDefault<z.ZodBoolean>;
        supportsSkills: z.ZodDefault<z.ZodBoolean>;
        supportsMcpServers: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strip>;
}, z.core.$strip>;
type ChatProviderDescriptor = z.infer<typeof chatProviderDescriptorSchema>;
declare const orchestratorCliProviderCapabilitiesSchema: z.ZodObject<{
    supportsCustomAgents: z.ZodDefault<z.ZodBoolean>;
    supportsExecutionMode: z.ZodDefault<z.ZodBoolean>;
    supportsProviderSessionResume: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
type OrchestratorCliProviderCapabilities = z.infer<typeof orchestratorCliProviderCapabilitiesSchema>;
declare const orchestratorCliProviderDescriptorSchema: z.ZodObject<{
    id: z.ZodString;
    displayName: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    command: z.ZodOptional<z.ZodString>;
    installed: z.ZodOptional<z.ZodBoolean>;
    capabilities: z.ZodObject<{
        supportsCustomAgents: z.ZodDefault<z.ZodBoolean>;
        supportsExecutionMode: z.ZodDefault<z.ZodBoolean>;
        supportsProviderSessionResume: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>;
}, z.core.$strip>;
type OrchestratorCliProviderDescriptor = z.infer<typeof orchestratorCliProviderDescriptorSchema>;
declare const providerCreditStatusKindSchema: z.ZodEnum<{
    error: "error";
    live: "live";
    local: "local";
    interactive: "interactive";
    unavailable: "unavailable";
    "not-installed": "not-installed";
}>;
type ProviderCreditStatusKind = z.infer<typeof providerCreditStatusKindSchema>;
declare const providerCreditSourceSchema: z.ZodEnum<{
    "live-cli": "live-cli";
    "local-cli": "local-cli";
    "provider-dashboard": "provider-dashboard";
    none: "none";
}>;
type ProviderCreditSource = z.infer<typeof providerCreditSourceSchema>;
declare const providerCreditMetricSchema: z.ZodObject<{
    id: z.ZodString;
    label: z.ZodString;
    value: z.ZodString;
    usedPercent: z.ZodOptional<z.ZodNumber>;
    remainingPercent: z.ZodOptional<z.ZodNumber>;
    resetAt: z.ZodOptional<z.ZodString>;
    detail: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
type ProviderCreditMetric = z.infer<typeof providerCreditMetricSchema>;
declare const providerCreditStatusSchema: z.ZodObject<{
    providerId: z.ZodString;
    displayName: z.ZodString;
    installed: z.ZodBoolean;
    status: z.ZodEnum<{
        error: "error";
        live: "live";
        local: "local";
        interactive: "interactive";
        unavailable: "unavailable";
        "not-installed": "not-installed";
    }>;
    source: z.ZodEnum<{
        "live-cli": "live-cli";
        "local-cli": "local-cli";
        "provider-dashboard": "provider-dashboard";
        none: "none";
    }>;
    summary: z.ZodString;
    plan: z.ZodOptional<z.ZodString>;
    metrics: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        label: z.ZodString;
        value: z.ZodString;
        usedPercent: z.ZodOptional<z.ZodNumber>;
        remainingPercent: z.ZodOptional<z.ZodNumber>;
        resetAt: z.ZodOptional<z.ZodString>;
        detail: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
    accountUrl: z.ZodOptional<z.ZodString>;
    actionLabel: z.ZodOptional<z.ZodString>;
    checkedAt: z.ZodString;
}, z.core.$strip>;
type ProviderCreditStatus = z.infer<typeof providerCreditStatusSchema>;
declare const providerCreditsDashboardSchema: z.ZodObject<{
    checkedAt: z.ZodString;
    cacheTtlSeconds: z.ZodNumber;
    providers: z.ZodArray<z.ZodObject<{
        providerId: z.ZodString;
        displayName: z.ZodString;
        installed: z.ZodBoolean;
        status: z.ZodEnum<{
            error: "error";
            live: "live";
            local: "local";
            interactive: "interactive";
            unavailable: "unavailable";
            "not-installed": "not-installed";
        }>;
        source: z.ZodEnum<{
            "live-cli": "live-cli";
            "local-cli": "local-cli";
            "provider-dashboard": "provider-dashboard";
            none: "none";
        }>;
        summary: z.ZodString;
        plan: z.ZodOptional<z.ZodString>;
        metrics: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            value: z.ZodString;
            usedPercent: z.ZodOptional<z.ZodNumber>;
            remainingPercent: z.ZodOptional<z.ZodNumber>;
            resetAt: z.ZodOptional<z.ZodString>;
            detail: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>>;
        accountUrl: z.ZodOptional<z.ZodString>;
        actionLabel: z.ZodOptional<z.ZodString>;
        checkedAt: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>;
type ProviderCreditsDashboard = z.infer<typeof providerCreditsDashboardSchema>;
declare const reasoningEffortSchema: z.ZodEnum<{
    low: "low";
    medium: "medium";
    high: "high";
    xhigh: "xhigh";
}>;
type ReasoningEffort = z.infer<typeof reasoningEffortSchema>;
declare const mcpServerConfigSchema: z.ZodUnion<readonly [z.ZodPipe<z.ZodObject<{
    type: z.ZodOptional<z.ZodEnum<{
        local: "local";
        stdio: "stdio";
    }>>;
    command: z.ZodString;
    args: z.ZodDefault<z.ZodArray<z.ZodString>>;
    cwd: z.ZodOptional<z.ZodString>;
    env: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
    tools: z.ZodDefault<z.ZodArray<z.ZodString>>;
    timeout: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>, z.ZodTransform<{
    type: "local" | "stdio";
    command: string;
    args: string[];
    env: Record<string, string>;
    tools: string[];
    cwd?: string | undefined;
    timeout?: number | undefined;
}, {
    command: string;
    args: string[];
    env: Record<string, string>;
    tools: string[];
    type?: "local" | "stdio" | undefined;
    cwd?: string | undefined;
    timeout?: number | undefined;
}>>, z.ZodPipe<z.ZodObject<{
    type: z.ZodOptional<z.ZodEnum<{
        http: "http";
        sse: "sse";
    }>>;
    url: z.ZodString;
    headers: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
    tools: z.ZodDefault<z.ZodArray<z.ZodString>>;
    timeout: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>, z.ZodTransform<{
    type: "http" | "sse";
    url: string;
    headers: Record<string, string>;
    tools: string[];
    timeout?: number | undefined;
}, {
    url: string;
    headers: Record<string, string>;
    tools: string[];
    type?: "http" | "sse" | undefined;
    timeout?: number | undefined;
}>>]>;
type McpServerConfig = z.infer<typeof mcpServerConfigSchema>;
declare const skillScopeSchema: z.ZodEnum<{
    "copilot-global": "copilot-global";
    "store-global": "store-global";
    "agent-local": "agent-local";
}>;
type SkillScope = z.infer<typeof skillScopeSchema>;
declare const skillDescriptorSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    scope: z.ZodEnum<{
        "copilot-global": "copilot-global";
        "store-global": "store-global";
        "agent-local": "agent-local";
    }>;
    path: z.ZodString;
    sourceRoot: z.ZodString;
}, z.core.$strip>;
type SkillDescriptor = z.infer<typeof skillDescriptorSchema>;
declare const chatRuntimeConfigSchema: z.ZodObject<{
    provider: z.ZodDefault<z.ZodString>;
    model: z.ZodDefault<z.ZodString>;
    reasoningEffort: z.ZodOptional<z.ZodEnum<{
        low: "low";
        medium: "medium";
        high: "high";
        xhigh: "xhigh";
    }>>;
    lmStudioEnableThinking: z.ZodOptional<z.ZodBoolean>;
    disabledSkills: z.ZodDefault<z.ZodArray<z.ZodString>>;
    mcpServers: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnion<readonly [z.ZodPipe<z.ZodObject<{
        type: z.ZodOptional<z.ZodEnum<{
            local: "local";
            stdio: "stdio";
        }>>;
        command: z.ZodString;
        args: z.ZodDefault<z.ZodArray<z.ZodString>>;
        cwd: z.ZodOptional<z.ZodString>;
        env: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
        tools: z.ZodDefault<z.ZodArray<z.ZodString>>;
        timeout: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>, z.ZodTransform<{
        type: "local" | "stdio";
        command: string;
        args: string[];
        env: Record<string, string>;
        tools: string[];
        cwd?: string | undefined;
        timeout?: number | undefined;
    }, {
        command: string;
        args: string[];
        env: Record<string, string>;
        tools: string[];
        type?: "local" | "stdio" | undefined;
        cwd?: string | undefined;
        timeout?: number | undefined;
    }>>, z.ZodPipe<z.ZodObject<{
        type: z.ZodOptional<z.ZodEnum<{
            http: "http";
            sse: "sse";
        }>>;
        url: z.ZodString;
        headers: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
        tools: z.ZodDefault<z.ZodArray<z.ZodString>>;
        timeout: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>, z.ZodTransform<{
        type: "http" | "sse";
        url: string;
        headers: Record<string, string>;
        tools: string[];
        timeout?: number | undefined;
    }, {
        url: string;
        headers: Record<string, string>;
        tools: string[];
        type?: "http" | "sse" | undefined;
        timeout?: number | undefined;
    }>>]>>>;
}, z.core.$strip>;
type ChatRuntimeConfig = z.infer<typeof chatRuntimeConfigSchema>;
declare const partialChatRuntimeConfigSchema: z.ZodObject<{
    provider: z.ZodOptional<z.ZodString>;
    model: z.ZodOptional<z.ZodString>;
    reasoningEffort: z.ZodOptional<z.ZodEnum<{
        low: "low";
        medium: "medium";
        high: "high";
        xhigh: "xhigh";
    }>>;
    lmStudioEnableThinking: z.ZodOptional<z.ZodBoolean>;
    disabledSkills: z.ZodOptional<z.ZodArray<z.ZodString>>;
    mcpServers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<readonly [z.ZodPipe<z.ZodObject<{
        type: z.ZodOptional<z.ZodEnum<{
            local: "local";
            stdio: "stdio";
        }>>;
        command: z.ZodString;
        args: z.ZodDefault<z.ZodArray<z.ZodString>>;
        cwd: z.ZodOptional<z.ZodString>;
        env: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
        tools: z.ZodDefault<z.ZodArray<z.ZodString>>;
        timeout: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>, z.ZodTransform<{
        type: "local" | "stdio";
        command: string;
        args: string[];
        env: Record<string, string>;
        tools: string[];
        cwd?: string | undefined;
        timeout?: number | undefined;
    }, {
        command: string;
        args: string[];
        env: Record<string, string>;
        tools: string[];
        type?: "local" | "stdio" | undefined;
        cwd?: string | undefined;
        timeout?: number | undefined;
    }>>, z.ZodPipe<z.ZodObject<{
        type: z.ZodOptional<z.ZodEnum<{
            http: "http";
            sse: "sse";
        }>>;
        url: z.ZodString;
        headers: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
        tools: z.ZodDefault<z.ZodArray<z.ZodString>>;
        timeout: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>, z.ZodTransform<{
        type: "http" | "sse";
        url: string;
        headers: Record<string, string>;
        tools: string[];
        timeout?: number | undefined;
    }, {
        url: string;
        headers: Record<string, string>;
        tools: string[];
        type?: "http" | "sse" | undefined;
        timeout?: number | undefined;
    }>>]>>>;
}, z.core.$strip>;
type PartialChatRuntimeConfig = z.infer<typeof partialChatRuntimeConfigSchema>;
declare function createDefaultChatRuntimeConfig(): ChatRuntimeConfig;
declare function mergeChatRuntimeConfigs(baseConfig?: Partial<ChatRuntimeConfig>, overrideConfig?: Partial<ChatRuntimeConfig>): ChatRuntimeConfig;
declare const llmQuotaSnapshotSchema: z.ZodObject<{
    isUnlimitedEntitlement: z.ZodBoolean;
    entitlementRequests: z.ZodPreprocess<z.ZodNumber>;
    usedRequests: z.ZodPreprocess<z.ZodNumber>;
    usageAllowedWithExhaustedQuota: z.ZodBoolean;
    overage: z.ZodPreprocess<z.ZodNumber>;
    overageAllowedWithExhaustedQuota: z.ZodBoolean;
    remainingPercentage: z.ZodPreprocess<z.ZodNumber>;
    resetDate: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
type LlmQuotaSnapshot = z.infer<typeof llmQuotaSnapshotSchema>;
declare const llmTokenDetailSchema: z.ZodObject<{
    batchSize: z.ZodNumber;
    costPerBatch: z.ZodNumber;
    tokenCount: z.ZodNumber;
    tokenType: z.ZodString;
}, z.core.$strip>;
type LlmTokenDetail = z.infer<typeof llmTokenDetailSchema>;
declare const llmRequestStatsSchema: z.ZodObject<{
    recordedAt: z.ZodString;
    model: z.ZodString;
    requestCount: z.ZodDefault<z.ZodNumber>;
    premiumRequestUnits: z.ZodDefault<z.ZodNumber>;
    inputTokens: z.ZodDefault<z.ZodNumber>;
    outputTokens: z.ZodDefault<z.ZodNumber>;
    cacheReadTokens: z.ZodDefault<z.ZodNumber>;
    cacheWriteTokens: z.ZodDefault<z.ZodNumber>;
    cost: z.ZodDefault<z.ZodNumber>;
    durationMs: z.ZodDefault<z.ZodNumber>;
    reasoningEffort: z.ZodOptional<z.ZodString>;
    initiator: z.ZodOptional<z.ZodString>;
    interactionId: z.ZodOptional<z.ZodString>;
    apiCallId: z.ZodOptional<z.ZodString>;
    providerCallId: z.ZodOptional<z.ZodString>;
    parentToolCallId: z.ZodOptional<z.ZodString>;
    quotaSnapshots: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodObject<{
        isUnlimitedEntitlement: z.ZodBoolean;
        entitlementRequests: z.ZodPreprocess<z.ZodNumber>;
        usedRequests: z.ZodPreprocess<z.ZodNumber>;
        usageAllowedWithExhaustedQuota: z.ZodBoolean;
        overage: z.ZodPreprocess<z.ZodNumber>;
        overageAllowedWithExhaustedQuota: z.ZodBoolean;
        remainingPercentage: z.ZodPreprocess<z.ZodNumber>;
        resetDate: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
    tokenDetails: z.ZodDefault<z.ZodArray<z.ZodObject<{
        batchSize: z.ZodNumber;
        costPerBatch: z.ZodNumber;
        tokenCount: z.ZodNumber;
        tokenType: z.ZodString;
    }, z.core.$strip>>>;
    totalNanoAiu: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
type LlmRequestStats = z.infer<typeof llmRequestStatsSchema>;
declare const llmSessionStatsSchema: z.ZodObject<{
    requestCount: z.ZodDefault<z.ZodNumber>;
    premiumRequestUnits: z.ZodDefault<z.ZodNumber>;
    inputTokens: z.ZodDefault<z.ZodNumber>;
    outputTokens: z.ZodDefault<z.ZodNumber>;
    cacheReadTokens: z.ZodDefault<z.ZodNumber>;
    cacheWriteTokens: z.ZodDefault<z.ZodNumber>;
    totalCost: z.ZodDefault<z.ZodNumber>;
    totalDurationMs: z.ZodDefault<z.ZodNumber>;
    totalNanoAiu: z.ZodDefault<z.ZodNumber>;
    lastRecordedAt: z.ZodOptional<z.ZodString>;
    lastModel: z.ZodOptional<z.ZodString>;
    lastReasoningEffort: z.ZodOptional<z.ZodString>;
    quotaSnapshots: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodObject<{
        isUnlimitedEntitlement: z.ZodBoolean;
        entitlementRequests: z.ZodPreprocess<z.ZodNumber>;
        usedRequests: z.ZodPreprocess<z.ZodNumber>;
        usageAllowedWithExhaustedQuota: z.ZodBoolean;
        overage: z.ZodPreprocess<z.ZodNumber>;
        overageAllowedWithExhaustedQuota: z.ZodBoolean;
        remainingPercentage: z.ZodPreprocess<z.ZodNumber>;
        resetDate: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
type LlmSessionStats = z.infer<typeof llmSessionStatsSchema>;
declare const premiumUsageSchema: z.ZodObject<{
    source: z.ZodEnum<{
        sdk: "sdk";
        "tmux-estimate": "tmux-estimate";
    }>;
    model: z.ZodString;
    premiumRequestUnits: z.ZodDefault<z.ZodNumber>;
    billingMultiplier: z.ZodOptional<z.ZodNumber>;
    recordedAt: z.ZodString;
}, z.core.$strip>;
type PremiumUsage = z.infer<typeof premiumUsageSchema>;
declare const premiumUsageTotalsSchema: z.ZodObject<{
    chargedRequestCount: z.ZodDefault<z.ZodNumber>;
    premiumRequestUnits: z.ZodDefault<z.ZodNumber>;
    lastRecordedAt: z.ZodOptional<z.ZodString>;
    lastModel: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
type PremiumUsageTotals = z.infer<typeof premiumUsageTotalsSchema>;
declare const modelDescriptorSchema: z.ZodObject<{
    id: z.ZodString;
    displayName: z.ZodString;
    runtimeProvider: z.ZodDefault<z.ZodString>;
    provider: z.ZodOptional<z.ZodString>;
    premiumRequestMultiplier: z.ZodOptional<z.ZodNumber>;
    supportedReasoningEfforts: z.ZodDefault<z.ZodArray<z.ZodEnum<{
        low: "low";
        medium: "medium";
        high: "high";
        xhigh: "xhigh";
    }>>>;
    defaultReasoningEffort: z.ZodOptional<z.ZodEnum<{
        low: "low";
        medium: "medium";
        high: "high";
        xhigh: "xhigh";
    }>>;
}, z.core.$strip>;
type ModelDescriptor = z.infer<typeof modelDescriptorSchema>;
declare const modelCatalogSchema: z.ZodObject<{
    defaultProvider: z.ZodDefault<z.ZodString>;
    providers: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        displayName: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        capabilities: z.ZodObject<{
            supportsReasoningEffort: z.ZodDefault<z.ZodBoolean>;
            supportsSkills: z.ZodDefault<z.ZodBoolean>;
            supportsMcpServers: z.ZodDefault<z.ZodBoolean>;
        }, z.core.$strip>;
    }, z.core.$strip>>>;
    models: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        displayName: z.ZodString;
        runtimeProvider: z.ZodDefault<z.ZodString>;
        provider: z.ZodOptional<z.ZodString>;
        premiumRequestMultiplier: z.ZodOptional<z.ZodNumber>;
        supportedReasoningEfforts: z.ZodDefault<z.ZodArray<z.ZodEnum<{
            low: "low";
            medium: "medium";
            high: "high";
            xhigh: "xhigh";
        }>>>;
        defaultReasoningEffort: z.ZodOptional<z.ZodEnum<{
            low: "low";
            medium: "medium";
            high: "high";
            xhigh: "xhigh";
        }>>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
type ModelCatalog = z.infer<typeof modelCatalogSchema>;
declare const agentKindSchema: z.ZodEnum<{
    chat: "chat";
    orchestrator: "orchestrator";
    schedule: "schedule";
}>;
type AgentKind = z.infer<typeof agentKindSchema>;
declare const agentSummarySchema: z.ZodObject<{
    id: z.ZodString;
    kind: z.ZodDefault<z.ZodEnum<{
        chat: "chat";
        orchestrator: "orchestrator";
        schedule: "schedule";
    }>>;
    title: z.ZodString;
    description: z.ZodString;
    combinedPrompt: z.ZodString;
    agentPath: z.ZodString;
    defaultSoulPath: z.ZodString;
    soulPath: z.ZodOptional<z.ZodString>;
    historyRoot: z.ZodString;
    workingMemoryRoot: z.ZodString;
    skillRoot: z.ZodString;
    skillNames: z.ZodArray<z.ZodString>;
    sessionCount: z.ZodNumber;
    runtimeConfig: z.ZodOptional<z.ZodObject<{
        provider: z.ZodDefault<z.ZodString>;
        model: z.ZodDefault<z.ZodString>;
        reasoningEffort: z.ZodOptional<z.ZodEnum<{
            low: "low";
            medium: "medium";
            high: "high";
            xhigh: "xhigh";
        }>>;
        lmStudioEnableThinking: z.ZodOptional<z.ZodBoolean>;
        disabledSkills: z.ZodDefault<z.ZodArray<z.ZodString>>;
        mcpServers: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnion<readonly [z.ZodPipe<z.ZodObject<{
            type: z.ZodOptional<z.ZodEnum<{
                local: "local";
                stdio: "stdio";
            }>>;
            command: z.ZodString;
            args: z.ZodDefault<z.ZodArray<z.ZodString>>;
            cwd: z.ZodOptional<z.ZodString>;
            env: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
            tools: z.ZodDefault<z.ZodArray<z.ZodString>>;
            timeout: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>, z.ZodTransform<{
            type: "local" | "stdio";
            command: string;
            args: string[];
            env: Record<string, string>;
            tools: string[];
            cwd?: string | undefined;
            timeout?: number | undefined;
        }, {
            command: string;
            args: string[];
            env: Record<string, string>;
            tools: string[];
            type?: "local" | "stdio" | undefined;
            cwd?: string | undefined;
            timeout?: number | undefined;
        }>>, z.ZodPipe<z.ZodObject<{
            type: z.ZodOptional<z.ZodEnum<{
                http: "http";
                sse: "sse";
            }>>;
            url: z.ZodString;
            headers: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
            tools: z.ZodDefault<z.ZodArray<z.ZodString>>;
            timeout: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>, z.ZodTransform<{
            type: "http" | "sse";
            url: string;
            headers: Record<string, string>;
            tools: string[];
            timeout?: number | undefined;
        }, {
            url: string;
            headers: Record<string, string>;
            tools: string[];
            type?: "http" | "sse" | undefined;
            timeout?: number | undefined;
        }>>]>>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
type AgentSummary = z.infer<typeof agentSummarySchema>;
declare const senderSchema: z.ZodEnum<{
    user: "user";
    assistant: "assistant";
    system: "system";
    tool: "tool";
}>;
type TurnSender = z.infer<typeof senderSchema>;
declare const attachmentMediaTypeSchema: z.ZodEnum<{
    image: "image";
    text: "text";
    binary: "binary";
}>;
type AttachmentMediaType = z.infer<typeof attachmentMediaTypeSchema>;
declare const attachmentUploadSchema: z.ZodObject<{
    name: z.ZodString;
    contentType: z.ZodString;
    size: z.ZodNumber;
    base64Data: z.ZodString;
}, z.core.$strip>;
type AttachmentUpload = z.infer<typeof attachmentUploadSchema>;
declare const storedAttachmentSchema: z.ZodObject<{
    attachmentId: z.ZodString;
    name: z.ZodString;
    contentType: z.ZodString;
    size: z.ZodNumber;
    mediaType: z.ZodEnum<{
        image: "image";
        text: "text";
        binary: "binary";
    }>;
    relativePath: z.ZodString;
}, z.core.$strip>;
type StoredAttachment = z.infer<typeof storedAttachmentSchema>;
declare const chatTurnSchema: z.ZodObject<{
    messageId: z.ZodString;
    sender: z.ZodEnum<{
        user: "user";
        assistant: "assistant";
        system: "system";
        tool: "tool";
    }>;
    createdAt: z.ZodString;
    bodyMarkdown: z.ZodString;
    thinkingMarkdown: z.ZodOptional<z.ZodString>;
    relativePath: z.ZodString;
    attachment: z.ZodOptional<z.ZodObject<{
        attachmentId: z.ZodString;
        name: z.ZodString;
        contentType: z.ZodString;
        size: z.ZodNumber;
        mediaType: z.ZodEnum<{
            image: "image";
            text: "text";
            binary: "binary";
        }>;
        relativePath: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>;
type ChatTurn = z.infer<typeof chatTurnSchema>;
declare const chatSessionSummarySchema: z.ZodObject<{
    sessionId: z.ZodString;
    agentId: z.ZodString;
    title: z.ZodString;
    startedAt: z.ZodString;
    summary: z.ZodString;
    manifestPath: z.ZodString;
    turnCount: z.ZodNumber;
    lastTurnAt: z.ZodOptional<z.ZodString>;
    runtimeConfig: z.ZodOptional<z.ZodObject<{
        provider: z.ZodDefault<z.ZodString>;
        model: z.ZodDefault<z.ZodString>;
        reasoningEffort: z.ZodOptional<z.ZodEnum<{
            low: "low";
            medium: "medium";
            high: "high";
            xhigh: "xhigh";
        }>>;
        lmStudioEnableThinking: z.ZodOptional<z.ZodBoolean>;
        disabledSkills: z.ZodDefault<z.ZodArray<z.ZodString>>;
        mcpServers: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnion<readonly [z.ZodPipe<z.ZodObject<{
            type: z.ZodOptional<z.ZodEnum<{
                local: "local";
                stdio: "stdio";
            }>>;
            command: z.ZodString;
            args: z.ZodDefault<z.ZodArray<z.ZodString>>;
            cwd: z.ZodOptional<z.ZodString>;
            env: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
            tools: z.ZodDefault<z.ZodArray<z.ZodString>>;
            timeout: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>, z.ZodTransform<{
            type: "local" | "stdio";
            command: string;
            args: string[];
            env: Record<string, string>;
            tools: string[];
            cwd?: string | undefined;
            timeout?: number | undefined;
        }, {
            command: string;
            args: string[];
            env: Record<string, string>;
            tools: string[];
            type?: "local" | "stdio" | undefined;
            cwd?: string | undefined;
            timeout?: number | undefined;
        }>>, z.ZodPipe<z.ZodObject<{
            type: z.ZodOptional<z.ZodEnum<{
                http: "http";
                sse: "sse";
            }>>;
            url: z.ZodString;
            headers: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
            tools: z.ZodDefault<z.ZodArray<z.ZodString>>;
            timeout: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>, z.ZodTransform<{
            type: "http" | "sse";
            url: string;
            headers: Record<string, string>;
            tools: string[];
            timeout?: number | undefined;
        }, {
            url: string;
            headers: Record<string, string>;
            tools: string[];
            type?: "http" | "sse" | undefined;
            timeout?: number | undefined;
        }>>]>>>;
    }, z.core.$strip>>;
    llmStats: z.ZodOptional<z.ZodObject<{
        requestCount: z.ZodDefault<z.ZodNumber>;
        premiumRequestUnits: z.ZodDefault<z.ZodNumber>;
        inputTokens: z.ZodDefault<z.ZodNumber>;
        outputTokens: z.ZodDefault<z.ZodNumber>;
        cacheReadTokens: z.ZodDefault<z.ZodNumber>;
        cacheWriteTokens: z.ZodDefault<z.ZodNumber>;
        totalCost: z.ZodDefault<z.ZodNumber>;
        totalDurationMs: z.ZodDefault<z.ZodNumber>;
        totalNanoAiu: z.ZodDefault<z.ZodNumber>;
        lastRecordedAt: z.ZodOptional<z.ZodString>;
        lastModel: z.ZodOptional<z.ZodString>;
        lastReasoningEffort: z.ZodOptional<z.ZodString>;
        quotaSnapshots: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodObject<{
            isUnlimitedEntitlement: z.ZodBoolean;
            entitlementRequests: z.ZodPreprocess<z.ZodNumber>;
            usedRequests: z.ZodPreprocess<z.ZodNumber>;
            usageAllowedWithExhaustedQuota: z.ZodBoolean;
            overage: z.ZodPreprocess<z.ZodNumber>;
            overageAllowedWithExhaustedQuota: z.ZodBoolean;
            remainingPercentage: z.ZodPreprocess<z.ZodNumber>;
            resetDate: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>>;
    }, z.core.$strip>>;
    premiumUsage: z.ZodOptional<z.ZodObject<{
        chargedRequestCount: z.ZodDefault<z.ZodNumber>;
        premiumRequestUnits: z.ZodDefault<z.ZodNumber>;
        lastRecordedAt: z.ZodOptional<z.ZodString>;
        lastModel: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    completionStatus: z.ZodOptional<z.ZodEnum<{
        completed: "completed";
        failed: "failed";
    }>>;
}, z.core.$strip>;
type ChatSessionSummary = z.infer<typeof chatSessionSummarySchema>;
declare const chatSessionSchema: z.ZodObject<{
    sessionId: z.ZodString;
    agentId: z.ZodString;
    title: z.ZodString;
    startedAt: z.ZodString;
    summary: z.ZodString;
    manifestPath: z.ZodString;
    turnCount: z.ZodNumber;
    lastTurnAt: z.ZodOptional<z.ZodString>;
    runtimeConfig: z.ZodOptional<z.ZodObject<{
        provider: z.ZodDefault<z.ZodString>;
        model: z.ZodDefault<z.ZodString>;
        reasoningEffort: z.ZodOptional<z.ZodEnum<{
            low: "low";
            medium: "medium";
            high: "high";
            xhigh: "xhigh";
        }>>;
        lmStudioEnableThinking: z.ZodOptional<z.ZodBoolean>;
        disabledSkills: z.ZodDefault<z.ZodArray<z.ZodString>>;
        mcpServers: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnion<readonly [z.ZodPipe<z.ZodObject<{
            type: z.ZodOptional<z.ZodEnum<{
                local: "local";
                stdio: "stdio";
            }>>;
            command: z.ZodString;
            args: z.ZodDefault<z.ZodArray<z.ZodString>>;
            cwd: z.ZodOptional<z.ZodString>;
            env: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
            tools: z.ZodDefault<z.ZodArray<z.ZodString>>;
            timeout: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>, z.ZodTransform<{
            type: "local" | "stdio";
            command: string;
            args: string[];
            env: Record<string, string>;
            tools: string[];
            cwd?: string | undefined;
            timeout?: number | undefined;
        }, {
            command: string;
            args: string[];
            env: Record<string, string>;
            tools: string[];
            type?: "local" | "stdio" | undefined;
            cwd?: string | undefined;
            timeout?: number | undefined;
        }>>, z.ZodPipe<z.ZodObject<{
            type: z.ZodOptional<z.ZodEnum<{
                http: "http";
                sse: "sse";
            }>>;
            url: z.ZodString;
            headers: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
            tools: z.ZodDefault<z.ZodArray<z.ZodString>>;
            timeout: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>, z.ZodTransform<{
            type: "http" | "sse";
            url: string;
            headers: Record<string, string>;
            tools: string[];
            timeout?: number | undefined;
        }, {
            url: string;
            headers: Record<string, string>;
            tools: string[];
            type?: "http" | "sse" | undefined;
            timeout?: number | undefined;
        }>>]>>>;
    }, z.core.$strip>>;
    llmStats: z.ZodOptional<z.ZodObject<{
        requestCount: z.ZodDefault<z.ZodNumber>;
        premiumRequestUnits: z.ZodDefault<z.ZodNumber>;
        inputTokens: z.ZodDefault<z.ZodNumber>;
        outputTokens: z.ZodDefault<z.ZodNumber>;
        cacheReadTokens: z.ZodDefault<z.ZodNumber>;
        cacheWriteTokens: z.ZodDefault<z.ZodNumber>;
        totalCost: z.ZodDefault<z.ZodNumber>;
        totalDurationMs: z.ZodDefault<z.ZodNumber>;
        totalNanoAiu: z.ZodDefault<z.ZodNumber>;
        lastRecordedAt: z.ZodOptional<z.ZodString>;
        lastModel: z.ZodOptional<z.ZodString>;
        lastReasoningEffort: z.ZodOptional<z.ZodString>;
        quotaSnapshots: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodObject<{
            isUnlimitedEntitlement: z.ZodBoolean;
            entitlementRequests: z.ZodPreprocess<z.ZodNumber>;
            usedRequests: z.ZodPreprocess<z.ZodNumber>;
            usageAllowedWithExhaustedQuota: z.ZodBoolean;
            overage: z.ZodPreprocess<z.ZodNumber>;
            overageAllowedWithExhaustedQuota: z.ZodBoolean;
            remainingPercentage: z.ZodPreprocess<z.ZodNumber>;
            resetDate: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>>;
    }, z.core.$strip>>;
    premiumUsage: z.ZodOptional<z.ZodObject<{
        chargedRequestCount: z.ZodDefault<z.ZodNumber>;
        premiumRequestUnits: z.ZodDefault<z.ZodNumber>;
        lastRecordedAt: z.ZodOptional<z.ZodString>;
        lastModel: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    completionStatus: z.ZodOptional<z.ZodEnum<{
        completed: "completed";
        failed: "failed";
    }>>;
    turns: z.ZodArray<z.ZodObject<{
        messageId: z.ZodString;
        sender: z.ZodEnum<{
            user: "user";
            assistant: "assistant";
            system: "system";
            tool: "tool";
        }>;
        createdAt: z.ZodString;
        bodyMarkdown: z.ZodString;
        thinkingMarkdown: z.ZodOptional<z.ZodString>;
        relativePath: z.ZodString;
        attachment: z.ZodOptional<z.ZodObject<{
            attachmentId: z.ZodString;
            name: z.ZodString;
            contentType: z.ZodString;
            size: z.ZodNumber;
            mediaType: z.ZodEnum<{
                image: "image";
                text: "text";
                binary: "binary";
            }>;
            relativePath: z.ZodString;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
type ChatSession = z.infer<typeof chatSessionSchema>;
declare const memoryEntrySchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodString;
    title: z.ZodString;
    path: z.ZodString;
    scope: z.ZodEnum<{
        shared: "shared";
        agent: "agent";
    }>;
    agentId: z.ZodOptional<z.ZodString>;
    tags: z.ZodArray<z.ZodString>;
    topics: z.ZodArray<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
type MemoryEntry = z.infer<typeof memoryEntrySchema>;
declare const orchestratorJobStatusSchema: z.ZodEnum<{
    completed: "completed";
    failed: "failed";
    queued: "queued";
    running: "running";
}>;
type OrchestratorJobStatus = z.infer<typeof orchestratorJobStatusSchema>;
declare const orchestratorSessionStatusSchema: z.ZodEnum<{
    completed: "completed";
    failed: "failed";
    running: "running";
    idle: "idle";
    missing: "missing";
}>;
type OrchestratorSessionStatus = z.infer<typeof orchestratorSessionStatusSchema>;
declare const orchestratorPromptModeSchema: z.ZodEnum<{
    file: "file";
    inline: "inline";
}>;
type OrchestratorPromptMode = z.infer<typeof orchestratorPromptModeSchema>;
declare const orchestratorExecutionModeSchema: z.ZodEnum<{
    standard: "standard";
    fleet: "fleet";
    auto: "auto";
}>;
type OrchestratorExecutionMode = z.infer<typeof orchestratorExecutionModeSchema>;
declare const orchestratorSessionRoleSchema: z.ZodEnum<{
    standard: "standard";
    master: "master";
}>;
type OrchestratorSessionRole = z.infer<typeof orchestratorSessionRoleSchema>;
declare const orchestratorWorkingTreeStateSchema: z.ZodEnum<{
    clean: "clean";
    dirty: "dirty";
    "non-git": "non-git";
    "git-unavailable": "git-unavailable";
}>;
type OrchestratorWorkingTreeState = z.infer<typeof orchestratorWorkingTreeStateSchema>;
declare const orchestratorWorkingTreeFileStatusSchema: z.ZodEnum<{
    modified: "modified";
    added: "added";
    deleted: "deleted";
    renamed: "renamed";
    copied: "copied";
    untracked: "untracked";
    unmerged: "unmerged";
}>;
type OrchestratorWorkingTreeFileStatus = z.infer<typeof orchestratorWorkingTreeFileStatusSchema>;
declare const orchestratorWorkingTreeFileSchema: z.ZodObject<{
    path: z.ZodString;
    previousPath: z.ZodOptional<z.ZodString>;
    statusCode: z.ZodString;
    stagedStatus: z.ZodOptional<z.ZodEnum<{
        modified: "modified";
        added: "added";
        deleted: "deleted";
        renamed: "renamed";
        copied: "copied";
        untracked: "untracked";
        unmerged: "unmerged";
    }>>;
    unstagedStatus: z.ZodOptional<z.ZodEnum<{
        modified: "modified";
        added: "added";
        deleted: "deleted";
        renamed: "renamed";
        copied: "copied";
        untracked: "untracked";
        unmerged: "unmerged";
    }>>;
    displayStatus: z.ZodString;
    lineStats: z.ZodOptional<z.ZodObject<{
        added: z.ZodNumber;
        removed: z.ZodNumber;
        isBinary: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strip>>;
}, z.core.$strip>;
type OrchestratorWorkingTreeFile = z.infer<typeof orchestratorWorkingTreeFileSchema>;
declare const orchestratorWorkingTreeSchema: z.ZodObject<{
    state: z.ZodEnum<{
        clean: "clean";
        dirty: "dirty";
        "non-git": "non-git";
        "git-unavailable": "git-unavailable";
    }>;
    projectPath: z.ZodString;
    repositoryRoot: z.ZodOptional<z.ZodString>;
    files: z.ZodDefault<z.ZodArray<z.ZodObject<{
        path: z.ZodString;
        previousPath: z.ZodOptional<z.ZodString>;
        statusCode: z.ZodString;
        stagedStatus: z.ZodOptional<z.ZodEnum<{
            modified: "modified";
            added: "added";
            deleted: "deleted";
            renamed: "renamed";
            copied: "copied";
            untracked: "untracked";
            unmerged: "unmerged";
        }>>;
        unstagedStatus: z.ZodOptional<z.ZodEnum<{
            modified: "modified";
            added: "added";
            deleted: "deleted";
            renamed: "renamed";
            copied: "copied";
            untracked: "untracked";
            unmerged: "unmerged";
        }>>;
        displayStatus: z.ZodString;
        lineStats: z.ZodOptional<z.ZodObject<{
            added: z.ZodNumber;
            removed: z.ZodNumber;
            isBinary: z.ZodDefault<z.ZodBoolean>;
        }, z.core.$strip>>;
    }, z.core.$strip>>>;
    message: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
type OrchestratorWorkingTree = z.infer<typeof orchestratorWorkingTreeSchema>;
declare const orchestratorWorkingTreeDiffStateSchema: z.ZodEnum<{
    "non-git": "non-git";
    "git-unavailable": "git-unavailable";
    ready: "ready";
    empty: "empty";
    "not-found": "not-found";
}>;
type OrchestratorWorkingTreeDiffState = z.infer<typeof orchestratorWorkingTreeDiffStateSchema>;
declare const orchestratorStructuredDiffLineSchema: z.ZodObject<{
    kind: z.ZodEnum<{
        context: "context";
        add: "add";
        remove: "remove";
        meta: "meta";
    }>;
    content: z.ZodString;
    oldLineNumber: z.ZodOptional<z.ZodNumber>;
    newLineNumber: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
type OrchestratorStructuredDiffLine = z.infer<typeof orchestratorStructuredDiffLineSchema>;
declare const orchestratorStructuredDiffHunkSchema: z.ZodObject<{
    header: z.ZodString;
    lines: z.ZodDefault<z.ZodArray<z.ZodObject<{
        kind: z.ZodEnum<{
            context: "context";
            add: "add";
            remove: "remove";
            meta: "meta";
        }>;
        content: z.ZodString;
        oldLineNumber: z.ZodOptional<z.ZodNumber>;
        newLineNumber: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
type OrchestratorStructuredDiffHunk = z.infer<typeof orchestratorStructuredDiffHunkSchema>;
declare const orchestratorStructuredDiffSchema: z.ZodObject<{
    oldPath: z.ZodOptional<z.ZodString>;
    newPath: z.ZodOptional<z.ZodString>;
    headerLines: z.ZodDefault<z.ZodArray<z.ZodString>>;
    hunks: z.ZodDefault<z.ZodArray<z.ZodObject<{
        header: z.ZodString;
        lines: z.ZodDefault<z.ZodArray<z.ZodObject<{
            kind: z.ZodEnum<{
                context: "context";
                add: "add";
                remove: "remove";
                meta: "meta";
            }>;
            content: z.ZodString;
            oldLineNumber: z.ZodOptional<z.ZodNumber>;
            newLineNumber: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>>>;
    }, z.core.$strip>>>;
    isBinary: z.ZodDefault<z.ZodBoolean>;
    hasText: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
type OrchestratorStructuredDiff = z.infer<typeof orchestratorStructuredDiffSchema>;
declare const orchestratorWorkingTreeDiffSchema: z.ZodObject<{
    state: z.ZodEnum<{
        "non-git": "non-git";
        "git-unavailable": "git-unavailable";
        ready: "ready";
        empty: "empty";
        "not-found": "not-found";
    }>;
    projectPath: z.ZodString;
    repositoryRoot: z.ZodOptional<z.ZodString>;
    path: z.ZodString;
    diff: z.ZodString;
    structured: z.ZodOptional<z.ZodObject<{
        oldPath: z.ZodOptional<z.ZodString>;
        newPath: z.ZodOptional<z.ZodString>;
        headerLines: z.ZodDefault<z.ZodArray<z.ZodString>>;
        hunks: z.ZodDefault<z.ZodArray<z.ZodObject<{
            header: z.ZodString;
            lines: z.ZodDefault<z.ZodArray<z.ZodObject<{
                kind: z.ZodEnum<{
                    context: "context";
                    add: "add";
                    remove: "remove";
                    meta: "meta";
                }>;
                content: z.ZodString;
                oldLineNumber: z.ZodOptional<z.ZodNumber>;
                newLineNumber: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strip>>>;
        }, z.core.$strip>>>;
        isBinary: z.ZodDefault<z.ZodBoolean>;
        hasText: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strip>>;
    message: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
type OrchestratorWorkingTreeDiff = z.infer<typeof orchestratorWorkingTreeDiffSchema>;
declare const orchestratorRepositoryEntryKindSchema: z.ZodEnum<{
    file: "file";
    directory: "directory";
}>;
type OrchestratorRepositoryEntryKind = z.infer<typeof orchestratorRepositoryEntryKindSchema>;
declare const orchestratorRepositoryEntrySchema: z.ZodObject<{
    path: z.ZodString;
    name: z.ZodString;
    kind: z.ZodEnum<{
        file: "file";
        directory: "directory";
    }>;
    size: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
type OrchestratorRepositoryEntry = z.infer<typeof orchestratorRepositoryEntrySchema>;
declare const orchestratorRepositoryDirectorySchema: z.ZodObject<{
    projectPath: z.ZodString;
    path: z.ZodString;
    parentPath: z.ZodOptional<z.ZodString>;
    entries: z.ZodDefault<z.ZodArray<z.ZodObject<{
        path: z.ZodString;
        name: z.ZodString;
        kind: z.ZodEnum<{
            file: "file";
            directory: "directory";
        }>;
        size: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
type OrchestratorRepositoryDirectory = z.infer<typeof orchestratorRepositoryDirectorySchema>;
declare const orchestratorRepositoryFileStateSchema: z.ZodEnum<{
    binary: "binary";
    ready: "ready";
}>;
type OrchestratorRepositoryFileState = z.infer<typeof orchestratorRepositoryFileStateSchema>;
declare const orchestratorRepositoryFileSchema: z.ZodObject<{
    state: z.ZodEnum<{
        binary: "binary";
        ready: "ready";
    }>;
    projectPath: z.ZodString;
    path: z.ZodString;
    size: z.ZodNumber;
    content: z.ZodString;
    truncated: z.ZodDefault<z.ZodBoolean>;
    message: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
type OrchestratorRepositoryFile = z.infer<typeof orchestratorRepositoryFileSchema>;
declare const orchestratorScheduleFrequencySchema: z.ZodEnum<{
    daily: "daily";
    weekly: "weekly";
    monthly: "monthly";
}>;
type OrchestratorScheduleFrequency = z.infer<typeof orchestratorScheduleFrequencySchema>;
declare const orchestratorScheduleDayOfWeekSchema: z.ZodEnum<{
    monday: "monday";
    tuesday: "tuesday";
    wednesday: "wednesday";
    thursday: "thursday";
    friday: "friday";
    saturday: "saturday";
    sunday: "sunday";
}>;
type OrchestratorScheduleDayOfWeek = z.infer<typeof orchestratorScheduleDayOfWeekSchema>;
declare const copilotCustomAgentSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    path: z.ZodString;
}, z.core.$strip>;
type CopilotCustomAgent = z.infer<typeof copilotCustomAgentSchema>;
declare const masterBatchConfidenceSchema: z.ZodEnum<{
    low: "low";
    medium: "medium";
    high: "high";
}>;
type MasterBatchConfidence = z.infer<typeof masterBatchConfidenceSchema>;
declare const masterBatchApprovalSchema: z.ZodEnum<{
    pending: "pending";
    approved: "approved";
    edited: "edited";
    skipped: "skipped";
}>;
type MasterBatchApproval = z.infer<typeof masterBatchApprovalSchema>;
declare const masterBatchItemStatusSchema: z.ZodEnum<{
    completed: "completed";
    failed: "failed";
    queued: "queued";
    running: "running";
    pending: "pending";
    skipped: "skipped";
}>;
type MasterBatchItemStatus = z.infer<typeof masterBatchItemStatusSchema>;
declare const masterBatchStatusSchema: z.ZodEnum<{
    planning: "planning";
    "awaiting-approval": "awaiting-approval";
    dispatched: "dispatched";
    done: "done";
    cancelled: "cancelled";
}>;
type MasterBatchStatus = z.infer<typeof masterBatchStatusSchema>;
declare const masterBatchItemSchema: z.ZodObject<{
    itemId: z.ZodString;
    sessionId: z.ZodString;
    sessionTitle: z.ZodOptional<z.ZodString>;
    jobId: z.ZodOptional<z.ZodString>;
    prompt: z.ZodString;
    confidence: z.ZodEnum<{
        low: "low";
        medium: "medium";
        high: "high";
    }>;
    reason: z.ZodString;
    approval: z.ZodEnum<{
        pending: "pending";
        approved: "approved";
        edited: "edited";
        skipped: "skipped";
    }>;
    editedPrompt: z.ZodOptional<z.ZodString>;
    status: z.ZodEnum<{
        completed: "completed";
        failed: "failed";
        queued: "queued";
        running: "running";
        pending: "pending";
        skipped: "skipped";
    }>;
}, z.core.$strip>;
type MasterBatchItem = z.infer<typeof masterBatchItemSchema>;
declare const masterBatchSchema: z.ZodObject<{
    batchId: z.ZodString;
    createdAt: z.ZodString;
    completedAt: z.ZodOptional<z.ZodString>;
    status: z.ZodEnum<{
        planning: "planning";
        "awaiting-approval": "awaiting-approval";
        dispatched: "dispatched";
        done: "done";
        cancelled: "cancelled";
    }>;
    originalPrompt: z.ZodString;
    attachmentId: z.ZodOptional<z.ZodString>;
    items: z.ZodDefault<z.ZodArray<z.ZodObject<{
        itemId: z.ZodString;
        sessionId: z.ZodString;
        sessionTitle: z.ZodOptional<z.ZodString>;
        jobId: z.ZodOptional<z.ZodString>;
        prompt: z.ZodString;
        confidence: z.ZodEnum<{
            low: "low";
            medium: "medium";
            high: "high";
        }>;
        reason: z.ZodString;
        approval: z.ZodEnum<{
            pending: "pending";
            approved: "approved";
            edited: "edited";
            skipped: "skipped";
        }>;
        editedPrompt: z.ZodOptional<z.ZodString>;
        status: z.ZodEnum<{
            completed: "completed";
            failed: "failed";
            queued: "queued";
            running: "running";
            pending: "pending";
            skipped: "skipped";
        }>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
type MasterBatch = z.infer<typeof masterBatchSchema>;
declare const orchestratorJobSchema: z.ZodObject<{
    jobId: z.ZodString;
    sessionId: z.ZodString;
    scheduleId: z.ZodOptional<z.ZodString>;
    masterBatchId: z.ZodOptional<z.ZodString>;
    masterItemId: z.ZodOptional<z.ZodString>;
    providerSessionId: z.ZodOptional<z.ZodString>;
    prompt: z.ZodOptional<z.ZodString>;
    promptPreview: z.ZodString;
    promptMode: z.ZodEnum<{
        file: "file";
        inline: "inline";
    }>;
    promptPath: z.ZodOptional<z.ZodString>;
    outputPath: z.ZodOptional<z.ZodString>;
    attachment: z.ZodOptional<z.ZodObject<{
        attachmentId: z.ZodString;
        name: z.ZodString;
        contentType: z.ZodString;
        size: z.ZodNumber;
        mediaType: z.ZodEnum<{
            image: "image";
            text: "text";
            binary: "binary";
        }>;
        relativePath: z.ZodString;
    }, z.core.$strip>>;
    customAgentId: z.ZodOptional<z.ZodString>;
    status: z.ZodEnum<{
        completed: "completed";
        failed: "failed";
        queued: "queued";
        running: "running";
    }>;
    submittedAt: z.ZodString;
    startedAt: z.ZodOptional<z.ZodString>;
    completedAt: z.ZodOptional<z.ZodString>;
    exitCode: z.ZodOptional<z.ZodNumber>;
    premiumUsage: z.ZodOptional<z.ZodObject<{
        source: z.ZodEnum<{
            sdk: "sdk";
            "tmux-estimate": "tmux-estimate";
        }>;
        model: z.ZodString;
        premiumRequestUnits: z.ZodDefault<z.ZodNumber>;
        billingMultiplier: z.ZodOptional<z.ZodNumber>;
        recordedAt: z.ZodString;
    }, z.core.$strip>>;
    jobDirectory: z.ZodString;
}, z.core.$strip>;
type OrchestratorJob = z.infer<typeof orchestratorJobSchema>;
declare const orchestratorSessionSummarySchema: z.ZodObject<{
    sessionId: z.ZodString;
    agentId: z.ZodString;
    role: z.ZodOptional<z.ZodEnum<{
        standard: "standard";
        master: "master";
    }>>;
    title: z.ZodString;
    startedAt: z.ZodString;
    updatedAt: z.ZodString;
    summary: z.ZodString;
    projectPath: z.ZodString;
    projectPurpose: z.ZodString;
    cliProvider: z.ZodOptional<z.ZodString>;
    model: z.ZodDefault<z.ZodString>;
    tmuxSessionName: z.ZodString;
    tmuxWindowName: z.ZodString;
    tmuxPaneId: z.ZodString;
    status: z.ZodEnum<{
        completed: "completed";
        failed: "failed";
        running: "running";
        idle: "idle";
        missing: "missing";
    }>;
    activeJobId: z.ZodOptional<z.ZodString>;
    lastJobId: z.ZodOptional<z.ZodString>;
    availableCustomAgents: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodString;
        path: z.ZodString;
    }, z.core.$strip>>>;
    selectedCustomAgentId: z.ZodOptional<z.ZodString>;
    providerSessionId: z.ZodOptional<z.ZodString>;
    reuseProviderSession: z.ZodOptional<z.ZodBoolean>;
    executionMode: z.ZodOptional<z.ZodEnum<{
        standard: "standard";
        fleet: "fleet";
        auto: "auto";
    }>>;
    premiumUsage: z.ZodOptional<z.ZodObject<{
        chargedRequestCount: z.ZodDefault<z.ZodNumber>;
        premiumRequestUnits: z.ZodDefault<z.ZodNumber>;
        lastRecordedAt: z.ZodOptional<z.ZodString>;
        lastModel: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    sessionDirectory: z.ZodString;
    manifestPath: z.ZodString;
}, z.core.$strip>;
type OrchestratorSessionSummary = z.infer<typeof orchestratorSessionSummarySchema>;
declare const orchestratorSessionSchema: z.ZodObject<{
    sessionId: z.ZodString;
    agentId: z.ZodString;
    role: z.ZodOptional<z.ZodEnum<{
        standard: "standard";
        master: "master";
    }>>;
    title: z.ZodString;
    startedAt: z.ZodString;
    updatedAt: z.ZodString;
    summary: z.ZodString;
    projectPath: z.ZodString;
    projectPurpose: z.ZodString;
    cliProvider: z.ZodOptional<z.ZodString>;
    model: z.ZodDefault<z.ZodString>;
    tmuxSessionName: z.ZodString;
    tmuxWindowName: z.ZodString;
    tmuxPaneId: z.ZodString;
    status: z.ZodEnum<{
        completed: "completed";
        failed: "failed";
        running: "running";
        idle: "idle";
        missing: "missing";
    }>;
    activeJobId: z.ZodOptional<z.ZodString>;
    lastJobId: z.ZodOptional<z.ZodString>;
    availableCustomAgents: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodString;
        path: z.ZodString;
    }, z.core.$strip>>>;
    selectedCustomAgentId: z.ZodOptional<z.ZodString>;
    providerSessionId: z.ZodOptional<z.ZodString>;
    reuseProviderSession: z.ZodOptional<z.ZodBoolean>;
    executionMode: z.ZodOptional<z.ZodEnum<{
        standard: "standard";
        fleet: "fleet";
        auto: "auto";
    }>>;
    premiumUsage: z.ZodOptional<z.ZodObject<{
        chargedRequestCount: z.ZodDefault<z.ZodNumber>;
        premiumRequestUnits: z.ZodDefault<z.ZodNumber>;
        lastRecordedAt: z.ZodOptional<z.ZodString>;
        lastModel: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    sessionDirectory: z.ZodString;
    manifestPath: z.ZodString;
    jobs: z.ZodArray<z.ZodObject<{
        jobId: z.ZodString;
        sessionId: z.ZodString;
        scheduleId: z.ZodOptional<z.ZodString>;
        masterBatchId: z.ZodOptional<z.ZodString>;
        masterItemId: z.ZodOptional<z.ZodString>;
        providerSessionId: z.ZodOptional<z.ZodString>;
        prompt: z.ZodOptional<z.ZodString>;
        promptPreview: z.ZodString;
        promptMode: z.ZodEnum<{
            file: "file";
            inline: "inline";
        }>;
        promptPath: z.ZodOptional<z.ZodString>;
        outputPath: z.ZodOptional<z.ZodString>;
        attachment: z.ZodOptional<z.ZodObject<{
            attachmentId: z.ZodString;
            name: z.ZodString;
            contentType: z.ZodString;
            size: z.ZodNumber;
            mediaType: z.ZodEnum<{
                image: "image";
                text: "text";
                binary: "binary";
            }>;
            relativePath: z.ZodString;
        }, z.core.$strip>>;
        customAgentId: z.ZodOptional<z.ZodString>;
        status: z.ZodEnum<{
            completed: "completed";
            failed: "failed";
            queued: "queued";
            running: "running";
        }>;
        submittedAt: z.ZodString;
        startedAt: z.ZodOptional<z.ZodString>;
        completedAt: z.ZodOptional<z.ZodString>;
        exitCode: z.ZodOptional<z.ZodNumber>;
        premiumUsage: z.ZodOptional<z.ZodObject<{
            source: z.ZodEnum<{
                sdk: "sdk";
                "tmux-estimate": "tmux-estimate";
            }>;
            model: z.ZodString;
            premiumRequestUnits: z.ZodDefault<z.ZodNumber>;
            billingMultiplier: z.ZodOptional<z.ZodNumber>;
            recordedAt: z.ZodString;
        }, z.core.$strip>>;
        jobDirectory: z.ZodString;
    }, z.core.$strip>>;
    terminalTail: z.ZodString;
    logSize: z.ZodNumber;
    systemNotice: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
type OrchestratorSession = z.infer<typeof orchestratorSessionSchema>;
declare const orchestratorCapabilitiesSchema: z.ZodObject<{
    available: z.ZodBoolean;
    defaultProjectPath: z.ZodString;
    recentProjectPaths: z.ZodDefault<z.ZodArray<z.ZodString>>;
    tmuxInstalled: z.ZodBoolean;
    copilotInstalled: z.ZodBoolean;
    geminiInstalled: z.ZodOptional<z.ZodBoolean>;
    codexInstalled: z.ZodOptional<z.ZodBoolean>;
    opencodeInstalled: z.ZodOptional<z.ZodBoolean>;
    antigravityInstalled: z.ZodOptional<z.ZodBoolean>;
    grokInstalled: z.ZodOptional<z.ZodBoolean>;
    defaultCliProvider: z.ZodOptional<z.ZodString>;
    cliProviders: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        displayName: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        command: z.ZodOptional<z.ZodString>;
        installed: z.ZodOptional<z.ZodBoolean>;
        capabilities: z.ZodObject<{
            supportsCustomAgents: z.ZodDefault<z.ZodBoolean>;
            supportsExecutionMode: z.ZodDefault<z.ZodBoolean>;
            supportsProviderSessionResume: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>;
    }, z.core.$strip>>>;
    supportedCliProviders: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        displayName: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        command: z.ZodOptional<z.ZodString>;
        installed: z.ZodOptional<z.ZodBoolean>;
        capabilities: z.ZodObject<{
            supportsCustomAgents: z.ZodDefault<z.ZodBoolean>;
            supportsExecutionMode: z.ZodDefault<z.ZodBoolean>;
            supportsProviderSessionResume: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>;
    }, z.core.$strip>>>;
    tmuxSessionName: z.ZodString;
    emailDeliveryAvailable: z.ZodOptional<z.ZodBoolean>;
    emailFromAddress: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
type OrchestratorCapabilities = z.infer<typeof orchestratorCapabilitiesSchema>;
declare const orchestratorScheduleSchema: z.ZodObject<{
    scheduleId: z.ZodString;
    sessionId: z.ZodString;
    title: z.ZodString;
    prompt: z.ZodString;
    frequency: z.ZodEnum<{
        daily: "daily";
        weekly: "weekly";
        monthly: "monthly";
    }>;
    timeOfDay: z.ZodString;
    timezone: z.ZodString;
    dayOfWeek: z.ZodOptional<z.ZodEnum<{
        monday: "monday";
        tuesday: "tuesday";
        wednesday: "wednesday";
        thursday: "thursday";
        friday: "friday";
        saturday: "saturday";
        sunday: "sunday";
    }>>;
    dayOfMonth: z.ZodOptional<z.ZodNumber>;
    customAgentId: z.ZodOptional<z.ZodString>;
    emailTo: z.ZodOptional<z.ZodString>;
    enabled: z.ZodBoolean;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    nextRunAt: z.ZodString;
    lastRunAt: z.ZodOptional<z.ZodString>;
    lastJobId: z.ZodOptional<z.ZodString>;
    lastJobStatus: z.ZodOptional<z.ZodEnum<{
        completed: "completed";
        failed: "failed";
        queued: "queued";
        running: "running";
    }>>;
    lastCompletedAt: z.ZodOptional<z.ZodString>;
    lastEmailAttemptAt: z.ZodOptional<z.ZodString>;
    lastEmailAttemptJobId: z.ZodOptional<z.ZodString>;
    lastEmailError: z.ZodOptional<z.ZodString>;
    totalRuns: z.ZodDefault<z.ZodNumber>;
    failedRuns: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
type OrchestratorSchedule = z.infer<typeof orchestratorScheduleSchema>;
declare const scheduleTaskRunStatusSchema: z.ZodEnum<{
    completed: "completed";
    failed: "failed";
    running: "running";
    idle: "idle";
}>;
type ScheduleTaskRunStatus = z.infer<typeof scheduleTaskRunStatusSchema>;
declare const scheduleTaskTargetKindSchema: z.ZodEnum<{
    chat: "chat";
    orchestrator: "orchestrator";
}>;
type ScheduleTaskTargetKind = z.infer<typeof scheduleTaskTargetKindSchema>;
declare const scheduleTaskSchema: z.ZodObject<{
    scheduleId: z.ZodString;
    targetKind: z.ZodDefault<z.ZodEnum<{
        chat: "chat";
        orchestrator: "orchestrator";
    }>>;
    agentId: z.ZodOptional<z.ZodString>;
    orchestratorSessionId: z.ZodOptional<z.ZodString>;
    chatSessionId: z.ZodOptional<z.ZodString>;
    title: z.ZodString;
    prompt: z.ZodString;
    frequency: z.ZodEnum<{
        daily: "daily";
        weekly: "weekly";
        monthly: "monthly";
    }>;
    timeOfDay: z.ZodString;
    timezone: z.ZodString;
    dayOfWeek: z.ZodOptional<z.ZodEnum<{
        monday: "monday";
        tuesday: "tuesday";
        wednesday: "wednesday";
        thursday: "thursday";
        friday: "friday";
        saturday: "saturday";
        sunday: "sunday";
    }>>;
    dayOfMonth: z.ZodOptional<z.ZodNumber>;
    enabled: z.ZodBoolean;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    nextRunAt: z.ZodString;
    lastRunAt: z.ZodOptional<z.ZodString>;
    lastCompletedAt: z.ZodOptional<z.ZodString>;
    lastRunStatus: z.ZodDefault<z.ZodEnum<{
        completed: "completed";
        failed: "failed";
        running: "running";
        idle: "idle";
    }>>;
    lastError: z.ZodOptional<z.ZodString>;
    totalRuns: z.ZodDefault<z.ZodNumber>;
    failedRuns: z.ZodDefault<z.ZodNumber>;
    runtimeConfig: z.ZodOptional<z.ZodObject<{
        provider: z.ZodDefault<z.ZodString>;
        model: z.ZodDefault<z.ZodString>;
        reasoningEffort: z.ZodOptional<z.ZodEnum<{
            low: "low";
            medium: "medium";
            high: "high";
            xhigh: "xhigh";
        }>>;
        lmStudioEnableThinking: z.ZodOptional<z.ZodBoolean>;
        disabledSkills: z.ZodDefault<z.ZodArray<z.ZodString>>;
        mcpServers: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnion<readonly [z.ZodPipe<z.ZodObject<{
            type: z.ZodOptional<z.ZodEnum<{
                local: "local";
                stdio: "stdio";
            }>>;
            command: z.ZodString;
            args: z.ZodDefault<z.ZodArray<z.ZodString>>;
            cwd: z.ZodOptional<z.ZodString>;
            env: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
            tools: z.ZodDefault<z.ZodArray<z.ZodString>>;
            timeout: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>, z.ZodTransform<{
            type: "local" | "stdio";
            command: string;
            args: string[];
            env: Record<string, string>;
            tools: string[];
            cwd?: string | undefined;
            timeout?: number | undefined;
        }, {
            command: string;
            args: string[];
            env: Record<string, string>;
            tools: string[];
            type?: "local" | "stdio" | undefined;
            cwd?: string | undefined;
            timeout?: number | undefined;
        }>>, z.ZodPipe<z.ZodObject<{
            type: z.ZodOptional<z.ZodEnum<{
                http: "http";
                sse: "sse";
            }>>;
            url: z.ZodString;
            headers: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
            tools: z.ZodDefault<z.ZodArray<z.ZodString>>;
            timeout: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>, z.ZodTransform<{
            type: "http" | "sse";
            url: string;
            headers: Record<string, string>;
            tools: string[];
            timeout?: number | undefined;
        }, {
            url: string;
            headers: Record<string, string>;
            tools: string[];
            type?: "http" | "sse" | undefined;
            timeout?: number | undefined;
        }>>]>>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
type ScheduleTask = z.infer<typeof scheduleTaskSchema>;
declare const scheduleTaskCreateSchema: z.ZodObject<{
    targetKind: z.ZodDefault<z.ZodEnum<{
        chat: "chat";
        orchestrator: "orchestrator";
    }>>;
    agentId: z.ZodOptional<z.ZodString>;
    orchestratorSessionId: z.ZodOptional<z.ZodString>;
    title: z.ZodString;
    prompt: z.ZodString;
    frequency: z.ZodEnum<{
        daily: "daily";
        weekly: "weekly";
        monthly: "monthly";
    }>;
    timeOfDay: z.ZodString;
    timezone: z.ZodString;
    dayOfWeek: z.ZodOptional<z.ZodEnum<{
        monday: "monday";
        tuesday: "tuesday";
        wednesday: "wednesday";
        thursday: "thursday";
        friday: "friday";
        saturday: "saturday";
        sunday: "sunday";
    }>>;
    dayOfMonth: z.ZodOptional<z.ZodNumber>;
    enabled: z.ZodDefault<z.ZodBoolean>;
    config: z.ZodOptional<z.ZodObject<{
        provider: z.ZodOptional<z.ZodString>;
        model: z.ZodOptional<z.ZodString>;
        reasoningEffort: z.ZodOptional<z.ZodEnum<{
            low: "low";
            medium: "medium";
            high: "high";
            xhigh: "xhigh";
        }>>;
        lmStudioEnableThinking: z.ZodOptional<z.ZodBoolean>;
        disabledSkills: z.ZodOptional<z.ZodArray<z.ZodString>>;
        mcpServers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<readonly [z.ZodPipe<z.ZodObject<{
            type: z.ZodOptional<z.ZodEnum<{
                local: "local";
                stdio: "stdio";
            }>>;
            command: z.ZodString;
            args: z.ZodDefault<z.ZodArray<z.ZodString>>;
            cwd: z.ZodOptional<z.ZodString>;
            env: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
            tools: z.ZodDefault<z.ZodArray<z.ZodString>>;
            timeout: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>, z.ZodTransform<{
            type: "local" | "stdio";
            command: string;
            args: string[];
            env: Record<string, string>;
            tools: string[];
            cwd?: string | undefined;
            timeout?: number | undefined;
        }, {
            command: string;
            args: string[];
            env: Record<string, string>;
            tools: string[];
            type?: "local" | "stdio" | undefined;
            cwd?: string | undefined;
            timeout?: number | undefined;
        }>>, z.ZodPipe<z.ZodObject<{
            type: z.ZodOptional<z.ZodEnum<{
                http: "http";
                sse: "sse";
            }>>;
            url: z.ZodString;
            headers: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
            tools: z.ZodDefault<z.ZodArray<z.ZodString>>;
            timeout: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>, z.ZodTransform<{
            type: "http" | "sse";
            url: string;
            headers: Record<string, string>;
            tools: string[];
            timeout?: number | undefined;
        }, {
            url: string;
            headers: Record<string, string>;
            tools: string[];
            type?: "http" | "sse" | undefined;
            timeout?: number | undefined;
        }>>]>>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
type ScheduleTaskCreateRequest = z.infer<typeof scheduleTaskCreateSchema>;
declare const scheduleTaskUpdateSchema: z.ZodObject<{
    targetKind: z.ZodDefault<z.ZodEnum<{
        chat: "chat";
        orchestrator: "orchestrator";
    }>>;
    agentId: z.ZodOptional<z.ZodString>;
    orchestratorSessionId: z.ZodOptional<z.ZodString>;
    title: z.ZodString;
    prompt: z.ZodString;
    frequency: z.ZodEnum<{
        daily: "daily";
        weekly: "weekly";
        monthly: "monthly";
    }>;
    timeOfDay: z.ZodString;
    timezone: z.ZodString;
    dayOfWeek: z.ZodOptional<z.ZodEnum<{
        monday: "monday";
        tuesday: "tuesday";
        wednesday: "wednesday";
        thursday: "thursday";
        friday: "friday";
        saturday: "saturday";
        sunday: "sunday";
    }>>;
    dayOfMonth: z.ZodOptional<z.ZodNumber>;
    enabled: z.ZodBoolean;
    config: z.ZodOptional<z.ZodObject<{
        provider: z.ZodOptional<z.ZodString>;
        model: z.ZodOptional<z.ZodString>;
        reasoningEffort: z.ZodOptional<z.ZodEnum<{
            low: "low";
            medium: "medium";
            high: "high";
            xhigh: "xhigh";
        }>>;
        lmStudioEnableThinking: z.ZodOptional<z.ZodBoolean>;
        disabledSkills: z.ZodOptional<z.ZodArray<z.ZodString>>;
        mcpServers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<readonly [z.ZodPipe<z.ZodObject<{
            type: z.ZodOptional<z.ZodEnum<{
                local: "local";
                stdio: "stdio";
            }>>;
            command: z.ZodString;
            args: z.ZodDefault<z.ZodArray<z.ZodString>>;
            cwd: z.ZodOptional<z.ZodString>;
            env: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
            tools: z.ZodDefault<z.ZodArray<z.ZodString>>;
            timeout: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>, z.ZodTransform<{
            type: "local" | "stdio";
            command: string;
            args: string[];
            env: Record<string, string>;
            tools: string[];
            cwd?: string | undefined;
            timeout?: number | undefined;
        }, {
            command: string;
            args: string[];
            env: Record<string, string>;
            tools: string[];
            type?: "local" | "stdio" | undefined;
            cwd?: string | undefined;
            timeout?: number | undefined;
        }>>, z.ZodPipe<z.ZodObject<{
            type: z.ZodOptional<z.ZodEnum<{
                http: "http";
                sse: "sse";
            }>>;
            url: z.ZodString;
            headers: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
            tools: z.ZodDefault<z.ZodArray<z.ZodString>>;
            timeout: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>, z.ZodTransform<{
            type: "http" | "sse";
            url: string;
            headers: Record<string, string>;
            tools: string[];
            timeout?: number | undefined;
        }, {
            url: string;
            headers: Record<string, string>;
            tools: string[];
            type?: "http" | "sse" | undefined;
            timeout?: number | undefined;
        }>>]>>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
type ScheduleTaskUpdateRequest = z.infer<typeof scheduleTaskUpdateSchema>;
declare const workspaceSummarySchema: z.ZodObject<{
    storeRoot: z.ZodString;
    copilotConfigDir: z.ZodString;
    storeSkillDirectory: z.ZodString;
    copilotSkillDirectory: z.ZodString;
    agentCount: z.ZodNumber;
}, z.core.$strip>;
type WorkspaceSummary = z.infer<typeof workspaceSummarySchema>;
declare const chatRequestSchema: z.ZodObject<{
    sessionId: z.ZodOptional<z.ZodString>;
    title: z.ZodOptional<z.ZodString>;
    prompt: z.ZodDefault<z.ZodString>;
    config: z.ZodOptional<z.ZodObject<{
        provider: z.ZodOptional<z.ZodString>;
        model: z.ZodOptional<z.ZodString>;
        reasoningEffort: z.ZodOptional<z.ZodEnum<{
            low: "low";
            medium: "medium";
            high: "high";
            xhigh: "xhigh";
        }>>;
        lmStudioEnableThinking: z.ZodOptional<z.ZodBoolean>;
        disabledSkills: z.ZodOptional<z.ZodArray<z.ZodString>>;
        mcpServers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<readonly [z.ZodPipe<z.ZodObject<{
            type: z.ZodOptional<z.ZodEnum<{
                local: "local";
                stdio: "stdio";
            }>>;
            command: z.ZodString;
            args: z.ZodDefault<z.ZodArray<z.ZodString>>;
            cwd: z.ZodOptional<z.ZodString>;
            env: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
            tools: z.ZodDefault<z.ZodArray<z.ZodString>>;
            timeout: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>, z.ZodTransform<{
            type: "local" | "stdio";
            command: string;
            args: string[];
            env: Record<string, string>;
            tools: string[];
            cwd?: string | undefined;
            timeout?: number | undefined;
        }, {
            command: string;
            args: string[];
            env: Record<string, string>;
            tools: string[];
            type?: "local" | "stdio" | undefined;
            cwd?: string | undefined;
            timeout?: number | undefined;
        }>>, z.ZodPipe<z.ZodObject<{
            type: z.ZodOptional<z.ZodEnum<{
                http: "http";
                sse: "sse";
            }>>;
            url: z.ZodString;
            headers: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
            tools: z.ZodDefault<z.ZodArray<z.ZodString>>;
            timeout: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>, z.ZodTransform<{
            type: "http" | "sse";
            url: string;
            headers: Record<string, string>;
            tools: string[];
            timeout?: number | undefined;
        }, {
            url: string;
            headers: Record<string, string>;
            tools: string[];
            type?: "http" | "sse" | undefined;
            timeout?: number | undefined;
        }>>]>>>;
    }, z.core.$strip>>;
    attachment: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        contentType: z.ZodString;
        size: z.ZodNumber;
        base64Data: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>;
type ChatRequest = z.infer<typeof chatRequestSchema>;
declare const chatResponseSchema: z.ZodObject<{
    thread: z.ZodObject<{
        sessionId: z.ZodString;
        agentId: z.ZodString;
        title: z.ZodString;
        startedAt: z.ZodString;
        summary: z.ZodString;
        manifestPath: z.ZodString;
        turnCount: z.ZodNumber;
        lastTurnAt: z.ZodOptional<z.ZodString>;
        runtimeConfig: z.ZodOptional<z.ZodObject<{
            provider: z.ZodDefault<z.ZodString>;
            model: z.ZodDefault<z.ZodString>;
            reasoningEffort: z.ZodOptional<z.ZodEnum<{
                low: "low";
                medium: "medium";
                high: "high";
                xhigh: "xhigh";
            }>>;
            lmStudioEnableThinking: z.ZodOptional<z.ZodBoolean>;
            disabledSkills: z.ZodDefault<z.ZodArray<z.ZodString>>;
            mcpServers: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnion<readonly [z.ZodPipe<z.ZodObject<{
                type: z.ZodOptional<z.ZodEnum<{
                    local: "local";
                    stdio: "stdio";
                }>>;
                command: z.ZodString;
                args: z.ZodDefault<z.ZodArray<z.ZodString>>;
                cwd: z.ZodOptional<z.ZodString>;
                env: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
                tools: z.ZodDefault<z.ZodArray<z.ZodString>>;
                timeout: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strip>, z.ZodTransform<{
                type: "local" | "stdio";
                command: string;
                args: string[];
                env: Record<string, string>;
                tools: string[];
                cwd?: string | undefined;
                timeout?: number | undefined;
            }, {
                command: string;
                args: string[];
                env: Record<string, string>;
                tools: string[];
                type?: "local" | "stdio" | undefined;
                cwd?: string | undefined;
                timeout?: number | undefined;
            }>>, z.ZodPipe<z.ZodObject<{
                type: z.ZodOptional<z.ZodEnum<{
                    http: "http";
                    sse: "sse";
                }>>;
                url: z.ZodString;
                headers: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
                tools: z.ZodDefault<z.ZodArray<z.ZodString>>;
                timeout: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strip>, z.ZodTransform<{
                type: "http" | "sse";
                url: string;
                headers: Record<string, string>;
                tools: string[];
                timeout?: number | undefined;
            }, {
                url: string;
                headers: Record<string, string>;
                tools: string[];
                type?: "http" | "sse" | undefined;
                timeout?: number | undefined;
            }>>]>>>;
        }, z.core.$strip>>;
        llmStats: z.ZodOptional<z.ZodObject<{
            requestCount: z.ZodDefault<z.ZodNumber>;
            premiumRequestUnits: z.ZodDefault<z.ZodNumber>;
            inputTokens: z.ZodDefault<z.ZodNumber>;
            outputTokens: z.ZodDefault<z.ZodNumber>;
            cacheReadTokens: z.ZodDefault<z.ZodNumber>;
            cacheWriteTokens: z.ZodDefault<z.ZodNumber>;
            totalCost: z.ZodDefault<z.ZodNumber>;
            totalDurationMs: z.ZodDefault<z.ZodNumber>;
            totalNanoAiu: z.ZodDefault<z.ZodNumber>;
            lastRecordedAt: z.ZodOptional<z.ZodString>;
            lastModel: z.ZodOptional<z.ZodString>;
            lastReasoningEffort: z.ZodOptional<z.ZodString>;
            quotaSnapshots: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodObject<{
                isUnlimitedEntitlement: z.ZodBoolean;
                entitlementRequests: z.ZodPreprocess<z.ZodNumber>;
                usedRequests: z.ZodPreprocess<z.ZodNumber>;
                usageAllowedWithExhaustedQuota: z.ZodBoolean;
                overage: z.ZodPreprocess<z.ZodNumber>;
                overageAllowedWithExhaustedQuota: z.ZodBoolean;
                remainingPercentage: z.ZodPreprocess<z.ZodNumber>;
                resetDate: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>>;
        }, z.core.$strip>>;
        premiumUsage: z.ZodOptional<z.ZodObject<{
            chargedRequestCount: z.ZodDefault<z.ZodNumber>;
            premiumRequestUnits: z.ZodDefault<z.ZodNumber>;
            lastRecordedAt: z.ZodOptional<z.ZodString>;
            lastModel: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        completionStatus: z.ZodOptional<z.ZodEnum<{
            completed: "completed";
            failed: "failed";
        }>>;
        turns: z.ZodArray<z.ZodObject<{
            messageId: z.ZodString;
            sender: z.ZodEnum<{
                user: "user";
                assistant: "assistant";
                system: "system";
                tool: "tool";
            }>;
            createdAt: z.ZodString;
            bodyMarkdown: z.ZodString;
            thinkingMarkdown: z.ZodOptional<z.ZodString>;
            relativePath: z.ZodString;
            attachment: z.ZodOptional<z.ZodObject<{
                attachmentId: z.ZodString;
                name: z.ZodString;
                contentType: z.ZodString;
                size: z.ZodNumber;
                mediaType: z.ZodEnum<{
                    image: "image";
                    text: "text";
                    binary: "binary";
                }>;
                relativePath: z.ZodString;
            }, z.core.$strip>>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    assistantTurn: z.ZodObject<{
        messageId: z.ZodString;
        sender: z.ZodEnum<{
            user: "user";
            assistant: "assistant";
            system: "system";
            tool: "tool";
        }>;
        createdAt: z.ZodString;
        bodyMarkdown: z.ZodString;
        thinkingMarkdown: z.ZodOptional<z.ZodString>;
        relativePath: z.ZodString;
        attachment: z.ZodOptional<z.ZodObject<{
            attachmentId: z.ZodString;
            name: z.ZodString;
            contentType: z.ZodString;
            size: z.ZodNumber;
            mediaType: z.ZodEnum<{
                image: "image";
                text: "text";
                binary: "binary";
            }>;
            relativePath: z.ZodString;
        }, z.core.$strip>>;
    }, z.core.$strip>;
}, z.core.$strip>;
type ChatResponse = z.infer<typeof chatResponseSchema>;
declare const chatStreamEventSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    type: z.ZodLiteral<"thread">;
    thread: z.ZodObject<{
        sessionId: z.ZodString;
        agentId: z.ZodString;
        title: z.ZodString;
        startedAt: z.ZodString;
        summary: z.ZodString;
        manifestPath: z.ZodString;
        turnCount: z.ZodNumber;
        lastTurnAt: z.ZodOptional<z.ZodString>;
        runtimeConfig: z.ZodOptional<z.ZodObject<{
            provider: z.ZodDefault<z.ZodString>;
            model: z.ZodDefault<z.ZodString>;
            reasoningEffort: z.ZodOptional<z.ZodEnum<{
                low: "low";
                medium: "medium";
                high: "high";
                xhigh: "xhigh";
            }>>;
            lmStudioEnableThinking: z.ZodOptional<z.ZodBoolean>;
            disabledSkills: z.ZodDefault<z.ZodArray<z.ZodString>>;
            mcpServers: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnion<readonly [z.ZodPipe<z.ZodObject<{
                type: z.ZodOptional<z.ZodEnum<{
                    local: "local";
                    stdio: "stdio";
                }>>;
                command: z.ZodString;
                args: z.ZodDefault<z.ZodArray<z.ZodString>>;
                cwd: z.ZodOptional<z.ZodString>;
                env: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
                tools: z.ZodDefault<z.ZodArray<z.ZodString>>;
                timeout: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strip>, z.ZodTransform<{
                type: "local" | "stdio";
                command: string;
                args: string[];
                env: Record<string, string>;
                tools: string[];
                cwd?: string | undefined;
                timeout?: number | undefined;
            }, {
                command: string;
                args: string[];
                env: Record<string, string>;
                tools: string[];
                type?: "local" | "stdio" | undefined;
                cwd?: string | undefined;
                timeout?: number | undefined;
            }>>, z.ZodPipe<z.ZodObject<{
                type: z.ZodOptional<z.ZodEnum<{
                    http: "http";
                    sse: "sse";
                }>>;
                url: z.ZodString;
                headers: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
                tools: z.ZodDefault<z.ZodArray<z.ZodString>>;
                timeout: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strip>, z.ZodTransform<{
                type: "http" | "sse";
                url: string;
                headers: Record<string, string>;
                tools: string[];
                timeout?: number | undefined;
            }, {
                url: string;
                headers: Record<string, string>;
                tools: string[];
                type?: "http" | "sse" | undefined;
                timeout?: number | undefined;
            }>>]>>>;
        }, z.core.$strip>>;
        llmStats: z.ZodOptional<z.ZodObject<{
            requestCount: z.ZodDefault<z.ZodNumber>;
            premiumRequestUnits: z.ZodDefault<z.ZodNumber>;
            inputTokens: z.ZodDefault<z.ZodNumber>;
            outputTokens: z.ZodDefault<z.ZodNumber>;
            cacheReadTokens: z.ZodDefault<z.ZodNumber>;
            cacheWriteTokens: z.ZodDefault<z.ZodNumber>;
            totalCost: z.ZodDefault<z.ZodNumber>;
            totalDurationMs: z.ZodDefault<z.ZodNumber>;
            totalNanoAiu: z.ZodDefault<z.ZodNumber>;
            lastRecordedAt: z.ZodOptional<z.ZodString>;
            lastModel: z.ZodOptional<z.ZodString>;
            lastReasoningEffort: z.ZodOptional<z.ZodString>;
            quotaSnapshots: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodObject<{
                isUnlimitedEntitlement: z.ZodBoolean;
                entitlementRequests: z.ZodPreprocess<z.ZodNumber>;
                usedRequests: z.ZodPreprocess<z.ZodNumber>;
                usageAllowedWithExhaustedQuota: z.ZodBoolean;
                overage: z.ZodPreprocess<z.ZodNumber>;
                overageAllowedWithExhaustedQuota: z.ZodBoolean;
                remainingPercentage: z.ZodPreprocess<z.ZodNumber>;
                resetDate: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>>;
        }, z.core.$strip>>;
        premiumUsage: z.ZodOptional<z.ZodObject<{
            chargedRequestCount: z.ZodDefault<z.ZodNumber>;
            premiumRequestUnits: z.ZodDefault<z.ZodNumber>;
            lastRecordedAt: z.ZodOptional<z.ZodString>;
            lastModel: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        completionStatus: z.ZodOptional<z.ZodEnum<{
            completed: "completed";
            failed: "failed";
        }>>;
        turns: z.ZodArray<z.ZodObject<{
            messageId: z.ZodString;
            sender: z.ZodEnum<{
                user: "user";
                assistant: "assistant";
                system: "system";
                tool: "tool";
            }>;
            createdAt: z.ZodString;
            bodyMarkdown: z.ZodString;
            thinkingMarkdown: z.ZodOptional<z.ZodString>;
            relativePath: z.ZodString;
            attachment: z.ZodOptional<z.ZodObject<{
                attachmentId: z.ZodString;
                name: z.ZodString;
                contentType: z.ZodString;
                size: z.ZodNumber;
                mediaType: z.ZodEnum<{
                    image: "image";
                    text: "text";
                    binary: "binary";
                }>;
                relativePath: z.ZodString;
            }, z.core.$strip>>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"assistant_snapshot">;
    assistantText: z.ZodOptional<z.ZodString>;
    thinkingText: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"complete">;
    response: z.ZodObject<{
        thread: z.ZodObject<{
            sessionId: z.ZodString;
            agentId: z.ZodString;
            title: z.ZodString;
            startedAt: z.ZodString;
            summary: z.ZodString;
            manifestPath: z.ZodString;
            turnCount: z.ZodNumber;
            lastTurnAt: z.ZodOptional<z.ZodString>;
            runtimeConfig: z.ZodOptional<z.ZodObject<{
                provider: z.ZodDefault<z.ZodString>;
                model: z.ZodDefault<z.ZodString>;
                reasoningEffort: z.ZodOptional<z.ZodEnum<{
                    low: "low";
                    medium: "medium";
                    high: "high";
                    xhigh: "xhigh";
                }>>;
                lmStudioEnableThinking: z.ZodOptional<z.ZodBoolean>;
                disabledSkills: z.ZodDefault<z.ZodArray<z.ZodString>>;
                mcpServers: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnion<readonly [z.ZodPipe<z.ZodObject<{
                    type: z.ZodOptional<z.ZodEnum<{
                        local: "local";
                        stdio: "stdio";
                    }>>;
                    command: z.ZodString;
                    args: z.ZodDefault<z.ZodArray<z.ZodString>>;
                    cwd: z.ZodOptional<z.ZodString>;
                    env: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
                    tools: z.ZodDefault<z.ZodArray<z.ZodString>>;
                    timeout: z.ZodOptional<z.ZodNumber>;
                }, z.core.$strip>, z.ZodTransform<{
                    type: "local" | "stdio";
                    command: string;
                    args: string[];
                    env: Record<string, string>;
                    tools: string[];
                    cwd?: string | undefined;
                    timeout?: number | undefined;
                }, {
                    command: string;
                    args: string[];
                    env: Record<string, string>;
                    tools: string[];
                    type?: "local" | "stdio" | undefined;
                    cwd?: string | undefined;
                    timeout?: number | undefined;
                }>>, z.ZodPipe<z.ZodObject<{
                    type: z.ZodOptional<z.ZodEnum<{
                        http: "http";
                        sse: "sse";
                    }>>;
                    url: z.ZodString;
                    headers: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
                    tools: z.ZodDefault<z.ZodArray<z.ZodString>>;
                    timeout: z.ZodOptional<z.ZodNumber>;
                }, z.core.$strip>, z.ZodTransform<{
                    type: "http" | "sse";
                    url: string;
                    headers: Record<string, string>;
                    tools: string[];
                    timeout?: number | undefined;
                }, {
                    url: string;
                    headers: Record<string, string>;
                    tools: string[];
                    type?: "http" | "sse" | undefined;
                    timeout?: number | undefined;
                }>>]>>>;
            }, z.core.$strip>>;
            llmStats: z.ZodOptional<z.ZodObject<{
                requestCount: z.ZodDefault<z.ZodNumber>;
                premiumRequestUnits: z.ZodDefault<z.ZodNumber>;
                inputTokens: z.ZodDefault<z.ZodNumber>;
                outputTokens: z.ZodDefault<z.ZodNumber>;
                cacheReadTokens: z.ZodDefault<z.ZodNumber>;
                cacheWriteTokens: z.ZodDefault<z.ZodNumber>;
                totalCost: z.ZodDefault<z.ZodNumber>;
                totalDurationMs: z.ZodDefault<z.ZodNumber>;
                totalNanoAiu: z.ZodDefault<z.ZodNumber>;
                lastRecordedAt: z.ZodOptional<z.ZodString>;
                lastModel: z.ZodOptional<z.ZodString>;
                lastReasoningEffort: z.ZodOptional<z.ZodString>;
                quotaSnapshots: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodObject<{
                    isUnlimitedEntitlement: z.ZodBoolean;
                    entitlementRequests: z.ZodPreprocess<z.ZodNumber>;
                    usedRequests: z.ZodPreprocess<z.ZodNumber>;
                    usageAllowedWithExhaustedQuota: z.ZodBoolean;
                    overage: z.ZodPreprocess<z.ZodNumber>;
                    overageAllowedWithExhaustedQuota: z.ZodBoolean;
                    remainingPercentage: z.ZodPreprocess<z.ZodNumber>;
                    resetDate: z.ZodOptional<z.ZodString>;
                }, z.core.$strip>>>;
            }, z.core.$strip>>;
            premiumUsage: z.ZodOptional<z.ZodObject<{
                chargedRequestCount: z.ZodDefault<z.ZodNumber>;
                premiumRequestUnits: z.ZodDefault<z.ZodNumber>;
                lastRecordedAt: z.ZodOptional<z.ZodString>;
                lastModel: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>;
            completionStatus: z.ZodOptional<z.ZodEnum<{
                completed: "completed";
                failed: "failed";
            }>>;
            turns: z.ZodArray<z.ZodObject<{
                messageId: z.ZodString;
                sender: z.ZodEnum<{
                    user: "user";
                    assistant: "assistant";
                    system: "system";
                    tool: "tool";
                }>;
                createdAt: z.ZodString;
                bodyMarkdown: z.ZodString;
                thinkingMarkdown: z.ZodOptional<z.ZodString>;
                relativePath: z.ZodString;
                attachment: z.ZodOptional<z.ZodObject<{
                    attachmentId: z.ZodString;
                    name: z.ZodString;
                    contentType: z.ZodString;
                    size: z.ZodNumber;
                    mediaType: z.ZodEnum<{
                        image: "image";
                        text: "text";
                        binary: "binary";
                    }>;
                    relativePath: z.ZodString;
                }, z.core.$strip>>;
            }, z.core.$strip>>;
        }, z.core.$strip>;
        assistantTurn: z.ZodObject<{
            messageId: z.ZodString;
            sender: z.ZodEnum<{
                user: "user";
                assistant: "assistant";
                system: "system";
                tool: "tool";
            }>;
            createdAt: z.ZodString;
            bodyMarkdown: z.ZodString;
            thinkingMarkdown: z.ZodOptional<z.ZodString>;
            relativePath: z.ZodString;
            attachment: z.ZodOptional<z.ZodObject<{
                attachmentId: z.ZodString;
                name: z.ZodString;
                contentType: z.ZodString;
                size: z.ZodNumber;
                mediaType: z.ZodEnum<{
                    image: "image";
                    text: "text";
                    binary: "binary";
                }>;
                relativePath: z.ZodString;
            }, z.core.$strip>>;
        }, z.core.$strip>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"error">;
    error: z.ZodString;
}, z.core.$strip>], "type">;
type ChatStreamEvent = z.infer<typeof chatStreamEventSchema>;
declare const orchestratorSessionCreateSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    projectPath: z.ZodString;
    projectPurpose: z.ZodString;
    role: z.ZodOptional<z.ZodEnum<{
        standard: "standard";
        master: "master";
    }>>;
    cliProvider: z.ZodOptional<z.ZodString>;
    model: z.ZodDefault<z.ZodString>;
    selectedCustomAgentId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    providerSessionId: z.ZodOptional<z.ZodString>;
    reuseProviderSession: z.ZodOptional<z.ZodBoolean>;
    executionMode: z.ZodOptional<z.ZodEnum<{
        standard: "standard";
        fleet: "fleet";
        auto: "auto";
    }>>;
    prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
type OrchestratorSessionCreateRequest = z.infer<typeof orchestratorSessionCreateSchema>;
declare const orchestratorSessionUpdateSchema: z.ZodObject<{
    title: z.ZodString;
    cliProvider: z.ZodOptional<z.ZodString>;
    model: z.ZodString;
    selectedCustomAgentId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    providerSessionId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    reuseProviderSession: z.ZodOptional<z.ZodBoolean>;
    executionMode: z.ZodOptional<z.ZodEnum<{
        standard: "standard";
        fleet: "fleet";
        auto: "auto";
    }>>;
}, z.core.$strip>;
type OrchestratorSessionUpdateRequest = z.infer<typeof orchestratorSessionUpdateSchema>;
declare const orchestratorDelegateRequestSchema: z.ZodObject<{
    prompt: z.ZodDefault<z.ZodString>;
    customAgentId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    providerSessionId: z.ZodOptional<z.ZodString>;
    attachment: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        contentType: z.ZodString;
        size: z.ZodNumber;
        base64Data: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>;
type OrchestratorDelegateRequest = z.infer<typeof orchestratorDelegateRequestSchema>;
declare const masterBatchCreateSchema: z.ZodObject<{
    status: z.ZodDefault<z.ZodEnum<{
        planning: "planning";
        "awaiting-approval": "awaiting-approval";
        dispatched: "dispatched";
        done: "done";
        cancelled: "cancelled";
    }>>;
    originalPrompt: z.ZodString;
    attachmentId: z.ZodOptional<z.ZodString>;
    items: z.ZodDefault<z.ZodArray<z.ZodObject<{
        sessionId: z.ZodString;
        confidence: z.ZodEnum<{
            low: "low";
            medium: "medium";
            high: "high";
        }>;
        sessionTitle: z.ZodOptional<z.ZodString>;
        jobId: z.ZodOptional<z.ZodString>;
        prompt: z.ZodString;
        reason: z.ZodString;
        editedPrompt: z.ZodOptional<z.ZodString>;
        approval: z.ZodOptional<z.ZodEnum<{
            pending: "pending";
            approved: "approved";
            edited: "edited";
            skipped: "skipped";
        }>>;
        status: z.ZodOptional<z.ZodEnum<{
            completed: "completed";
            failed: "failed";
            queued: "queued";
            running: "running";
            pending: "pending";
            skipped: "skipped";
        }>>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
type MasterBatchCreateRequest = z.infer<typeof masterBatchCreateSchema>;
declare const masterBatchUpdateSchema: z.ZodObject<{
    completedAt: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        planning: "planning";
        "awaiting-approval": "awaiting-approval";
        dispatched: "dispatched";
        done: "done";
        cancelled: "cancelled";
    }>>;
    originalPrompt: z.ZodOptional<z.ZodString>;
    attachmentId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    items: z.ZodOptional<z.ZodArray<z.ZodObject<{
        itemId: z.ZodString;
        sessionId: z.ZodString;
        sessionTitle: z.ZodOptional<z.ZodString>;
        jobId: z.ZodOptional<z.ZodString>;
        prompt: z.ZodString;
        confidence: z.ZodEnum<{
            low: "low";
            medium: "medium";
            high: "high";
        }>;
        reason: z.ZodString;
        approval: z.ZodEnum<{
            pending: "pending";
            approved: "approved";
            edited: "edited";
            skipped: "skipped";
        }>;
        editedPrompt: z.ZodOptional<z.ZodString>;
        status: z.ZodEnum<{
            completed: "completed";
            failed: "failed";
            queued: "queued";
            running: "running";
            pending: "pending";
            skipped: "skipped";
        }>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
type MasterBatchUpdateRequest = z.infer<typeof masterBatchUpdateSchema>;
declare const orchestratorTerminalInputSchema: z.ZodObject<{
    input: z.ZodString;
    submit: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
type OrchestratorTerminalInputRequest = z.infer<typeof orchestratorTerminalInputSchema>;
declare const orchestratorTerminalHistoryChunkSchema: z.ZodObject<{
    chunk: z.ZodString;
    startOffset: z.ZodNumber;
    endOffset: z.ZodNumber;
    hasMoreBefore: z.ZodBoolean;
    lineCount: z.ZodNumber;
}, z.core.$strip>;
type OrchestratorTerminalHistoryChunk = z.infer<typeof orchestratorTerminalHistoryChunkSchema>;
declare const orchestratorScheduleCreateSchema: z.ZodObject<{
    sessionId: z.ZodString;
    title: z.ZodString;
    prompt: z.ZodString;
    frequency: z.ZodEnum<{
        daily: "daily";
        weekly: "weekly";
        monthly: "monthly";
    }>;
    timeOfDay: z.ZodString;
    timezone: z.ZodString;
    dayOfWeek: z.ZodOptional<z.ZodEnum<{
        monday: "monday";
        tuesday: "tuesday";
        wednesday: "wednesday";
        thursday: "thursday";
        friday: "friday";
        saturday: "saturday";
        sunday: "sunday";
    }>>;
    dayOfMonth: z.ZodOptional<z.ZodNumber>;
    customAgentId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    emailTo: z.ZodOptional<z.ZodString>;
    enabled: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
type OrchestratorScheduleCreateRequest = z.infer<typeof orchestratorScheduleCreateSchema>;
declare const orchestratorScheduleUpdateSchema: z.ZodObject<{
    title: z.ZodString;
    prompt: z.ZodString;
    frequency: z.ZodEnum<{
        daily: "daily";
        weekly: "weekly";
        monthly: "monthly";
    }>;
    timeOfDay: z.ZodString;
    timezone: z.ZodString;
    dayOfWeek: z.ZodOptional<z.ZodEnum<{
        monday: "monday";
        tuesday: "tuesday";
        wednesday: "wednesday";
        thursday: "thursday";
        friday: "friday";
        saturday: "saturday";
        sunday: "sunday";
    }>>;
    dayOfMonth: z.ZodOptional<z.ZodNumber>;
    customAgentId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    emailTo: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    enabled: z.ZodBoolean;
}, z.core.$strip>;
type OrchestratorScheduleUpdateRequest = z.infer<typeof orchestratorScheduleUpdateSchema>;
declare const memoryAnalysisRequestSchema: z.ZodObject<{
    config: z.ZodOptional<z.ZodObject<{
        provider: z.ZodOptional<z.ZodString>;
        model: z.ZodOptional<z.ZodString>;
        reasoningEffort: z.ZodOptional<z.ZodEnum<{
            low: "low";
            medium: "medium";
            high: "high";
            xhigh: "xhigh";
        }>>;
        lmStudioEnableThinking: z.ZodOptional<z.ZodBoolean>;
        disabledSkills: z.ZodOptional<z.ZodArray<z.ZodString>>;
        mcpServers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<readonly [z.ZodPipe<z.ZodObject<{
            type: z.ZodOptional<z.ZodEnum<{
                local: "local";
                stdio: "stdio";
            }>>;
            command: z.ZodString;
            args: z.ZodDefault<z.ZodArray<z.ZodString>>;
            cwd: z.ZodOptional<z.ZodString>;
            env: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
            tools: z.ZodDefault<z.ZodArray<z.ZodString>>;
            timeout: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>, z.ZodTransform<{
            type: "local" | "stdio";
            command: string;
            args: string[];
            env: Record<string, string>;
            tools: string[];
            cwd?: string | undefined;
            timeout?: number | undefined;
        }, {
            command: string;
            args: string[];
            env: Record<string, string>;
            tools: string[];
            type?: "local" | "stdio" | undefined;
            cwd?: string | undefined;
            timeout?: number | undefined;
        }>>, z.ZodPipe<z.ZodObject<{
            type: z.ZodOptional<z.ZodEnum<{
                http: "http";
                sse: "sse";
            }>>;
            url: z.ZodString;
            headers: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
            tools: z.ZodDefault<z.ZodArray<z.ZodString>>;
            timeout: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>, z.ZodTransform<{
            type: "http" | "sse";
            url: string;
            headers: Record<string, string>;
            tools: string[];
            timeout?: number | undefined;
        }, {
            url: string;
            headers: Record<string, string>;
            tools: string[];
            type?: "http" | "sse" | undefined;
            timeout?: number | undefined;
        }>>]>>>;
    }, z.core.$strip>>;
    model: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
type MemoryAnalysisRequest = z.infer<typeof memoryAnalysisRequestSchema>;
declare const memoryTierSchema: z.ZodEnum<{
    working: "working";
    "short-term": "short-term";
    "long-term": "long-term";
}>;
type MemoryTier = z.infer<typeof memoryTierSchema>;
declare const memoryAnalysisToolExecutionSchema: z.ZodObject<{
    toolName: z.ZodString;
    success: z.ZodBoolean;
    content: z.ZodOptional<z.ZodString>;
    memoryTier: z.ZodOptional<z.ZodEnum<{
        working: "working";
        "short-term": "short-term";
        "long-term": "long-term";
    }>>;
}, z.core.$strip>;
type MemoryAnalysisToolExecution = z.infer<typeof memoryAnalysisToolExecutionSchema>;
declare const memoryAnalysisTierSummarySchema: z.ZodObject<{
    summary: z.ZodDefault<z.ZodString>;
    items: z.ZodDefault<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
type MemoryAnalysisTierSummary = z.infer<typeof memoryAnalysisTierSummarySchema>;
declare const memoryAnalysisEntryChangeSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    path: z.ZodString;
    status: z.ZodEnum<{
        added: "added";
        updated: "updated";
    }>;
    tier: z.ZodEnum<{
        working: "working";
        "short-term": "short-term";
        "long-term": "long-term";
    }>;
    updatedAt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
type MemoryAnalysisEntryChange = z.infer<typeof memoryAnalysisEntryChangeSchema>;
declare const memoryAnalysisResponseSchema: z.ZodObject<{
    markdown: z.ZodString;
    model: z.ZodString;
    configuredMemorySkillNames: z.ZodDefault<z.ZodArray<z.ZodString>>;
    enabledSkillNames: z.ZodDefault<z.ZodArray<z.ZodString>>;
    loadedSkillNames: z.ZodDefault<z.ZodArray<z.ZodString>>;
    invokedSkillNames: z.ZodDefault<z.ZodArray<z.ZodString>>;
    toolExecutions: z.ZodDefault<z.ZodArray<z.ZodObject<{
        toolName: z.ZodString;
        success: z.ZodBoolean;
        content: z.ZodOptional<z.ZodString>;
        memoryTier: z.ZodOptional<z.ZodEnum<{
            working: "working";
            "short-term": "short-term";
            "long-term": "long-term";
        }>>;
    }, z.core.$strip>>>;
    reportedLoadedSkills: z.ZodDefault<z.ZodBoolean>;
    analysisByTier: z.ZodObject<{
        working: z.ZodObject<{
            summary: z.ZodDefault<z.ZodString>;
            items: z.ZodDefault<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>;
        shortTerm: z.ZodObject<{
            summary: z.ZodDefault<z.ZodString>;
            items: z.ZodDefault<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>;
        longTerm: z.ZodObject<{
            summary: z.ZodDefault<z.ZodString>;
            items: z.ZodDefault<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>;
    }, z.core.$strip>;
    memoryChanges: z.ZodObject<{
        working: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            title: z.ZodString;
            path: z.ZodString;
            status: z.ZodEnum<{
                added: "added";
                updated: "updated";
            }>;
            tier: z.ZodEnum<{
                working: "working";
                "short-term": "short-term";
                "long-term": "long-term";
            }>;
            updatedAt: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>>;
        shortTerm: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            title: z.ZodString;
            path: z.ZodString;
            status: z.ZodEnum<{
                added: "added";
                updated: "updated";
            }>;
            tier: z.ZodEnum<{
                working: "working";
                "short-term": "short-term";
                "long-term": "long-term";
            }>;
            updatedAt: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>>;
        longTerm: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            title: z.ZodString;
            path: z.ZodString;
            status: z.ZodEnum<{
                added: "added";
                updated: "updated";
            }>;
            tier: z.ZodEnum<{
                working: "working";
                "short-term": "short-term";
                "long-term": "long-term";
            }>;
            updatedAt: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>>;
    }, z.core.$strip>;
}, z.core.$strip>;
type MemoryAnalysisResponse = z.infer<typeof memoryAnalysisResponseSchema>;
declare const apiErrorSchema: z.ZodObject<{
    error: z.ZodString;
}, z.core.$strip>;
type ApiError = z.infer<typeof apiErrorSchema>;
declare function normalizeApiErrorMessage(body: string, status: number): string;
declare function readResponseErrorMessage(response: Pick<Response, "status" | "text">): Promise<string>;
/**
 * Fetches a URL, parses the response as JSON, and throws on non-2xx status.
 *
 * Uses the global `fetch` available in both browser (Vite) and Node ≥18 (CLI).
 * The caller is responsible for building the full URL.
 */
declare function fetchJson<T>(resource: string, init?: RequestInit): Promise<T>;

export { type AgentKind, type AgentSummary, type ApiError, type AttachmentMediaType, type AttachmentUpload, type ChatProviderCapabilities, type ChatProviderDescriptor, type ChatRequest, type ChatResponse, type ChatRuntimeConfig, type ChatSession, type ChatSessionSummary, type ChatStreamEvent, type ChatTurn, type CopilotCustomAgent, DEFAULT_CHAT_MODEL, DEFAULT_CHAT_PROVIDER, DEFAULT_ORCHESTRATOR_CLI_PROVIDER, type LlmQuotaSnapshot, type LlmRequestStats, type LlmSessionStats, type LlmTokenDetail, type MasterBatch, type MasterBatchApproval, type MasterBatchConfidence, type MasterBatchCreateRequest, type MasterBatchItem, type MasterBatchItemStatus, type MasterBatchStatus, type MasterBatchUpdateRequest, type McpServerConfig, type MemoryAnalysisEntryChange, type MemoryAnalysisRequest, type MemoryAnalysisResponse, type MemoryAnalysisTierSummary, type MemoryAnalysisToolExecution, type MemoryEntry, type MemoryTier, type ModelCatalog, type ModelDescriptor, type OrchestratorCapabilities, type OrchestratorCliProviderCapabilities, type OrchestratorCliProviderDescriptor, type OrchestratorDelegateRequest, type OrchestratorExecutionMode, type OrchestratorJob, type OrchestratorJobStatus, type OrchestratorPromptMode, type OrchestratorRepositoryDirectory, type OrchestratorRepositoryEntry, type OrchestratorRepositoryEntryKind, type OrchestratorRepositoryFile, type OrchestratorRepositoryFileState, type OrchestratorSchedule, type OrchestratorScheduleCreateRequest, type OrchestratorScheduleDayOfWeek, type OrchestratorScheduleFrequency, type OrchestratorScheduleUpdateRequest, type OrchestratorSession, type OrchestratorSessionCreateRequest, type OrchestratorSessionRole, type OrchestratorSessionStatus, type OrchestratorSessionSummary, type OrchestratorSessionUpdateRequest, type OrchestratorStructuredDiff, type OrchestratorStructuredDiffHunk, type OrchestratorStructuredDiffLine, type OrchestratorTerminalHistoryChunk, type OrchestratorTerminalInputRequest, type OrchestratorWorkingTree, type OrchestratorWorkingTreeDiff, type OrchestratorWorkingTreeDiffState, type OrchestratorWorkingTreeFile, type OrchestratorWorkingTreeFileStatus, type OrchestratorWorkingTreeState, type PartialChatRuntimeConfig, type PremiumUsage, type PremiumUsageTotals, type ProviderCreditMetric, type ProviderCreditSource, type ProviderCreditStatus, type ProviderCreditStatusKind, type ProviderCreditsDashboard, type ReasoningEffort, type ScheduleTask, type ScheduleTaskCreateRequest, type ScheduleTaskRunStatus, type ScheduleTaskTargetKind, type ScheduleTaskUpdateRequest, type SkillDescriptor, type SkillScope, type StoredAttachment, type TurnSender, type WorkspaceSummary, agentKindSchema, agentSummarySchema, apiErrorSchema, attachmentMediaTypeSchema, attachmentUploadSchema, chatProviderCapabilitiesSchema, chatProviderDescriptorSchema, chatRequestSchema, chatResponseSchema, chatRuntimeConfigSchema, chatSessionSchema, chatSessionSummarySchema, chatStreamEventSchema, chatTurnSchema, copilotCustomAgentSchema, createDefaultChatRuntimeConfig, fetchJson, llmQuotaSnapshotSchema, llmRequestStatsSchema, llmSessionStatsSchema, llmTokenDetailSchema, masterBatchApprovalSchema, masterBatchConfidenceSchema, masterBatchCreateSchema, masterBatchItemSchema, masterBatchItemStatusSchema, masterBatchSchema, masterBatchStatusSchema, masterBatchUpdateSchema, mcpServerConfigSchema, memoryAnalysisEntryChangeSchema, memoryAnalysisRequestSchema, memoryAnalysisResponseSchema, memoryAnalysisTierSummarySchema, memoryAnalysisToolExecutionSchema, memoryEntrySchema, memoryTierSchema, mergeChatRuntimeConfigs, modelCatalogSchema, modelDescriptorSchema, normalizeApiErrorMessage, orchestratorCapabilitiesSchema, orchestratorCliProviderCapabilitiesSchema, orchestratorCliProviderDescriptorSchema, orchestratorDelegateRequestSchema, orchestratorExecutionModeSchema, orchestratorJobSchema, orchestratorJobStatusSchema, orchestratorPromptModeSchema, orchestratorRepositoryDirectorySchema, orchestratorRepositoryEntryKindSchema, orchestratorRepositoryEntrySchema, orchestratorRepositoryFileSchema, orchestratorRepositoryFileStateSchema, orchestratorScheduleCreateSchema, orchestratorScheduleDayOfWeekSchema, orchestratorScheduleFrequencySchema, orchestratorScheduleSchema, orchestratorScheduleUpdateSchema, orchestratorSessionCreateSchema, orchestratorSessionRoleSchema, orchestratorSessionSchema, orchestratorSessionStatusSchema, orchestratorSessionSummarySchema, orchestratorSessionUpdateSchema, orchestratorStructuredDiffHunkSchema, orchestratorStructuredDiffLineSchema, orchestratorStructuredDiffSchema, orchestratorTerminalHistoryChunkSchema, orchestratorTerminalInputSchema, orchestratorWorkingTreeDiffSchema, orchestratorWorkingTreeDiffStateSchema, orchestratorWorkingTreeFileSchema, orchestratorWorkingTreeFileStatusSchema, orchestratorWorkingTreeSchema, orchestratorWorkingTreeStateSchema, partialChatRuntimeConfigSchema, premiumUsageSchema, premiumUsageTotalsSchema, providerCreditMetricSchema, providerCreditSourceSchema, providerCreditStatusKindSchema, providerCreditStatusSchema, providerCreditsDashboardSchema, readResponseErrorMessage, reasoningEffortSchema, scheduleTaskCreateSchema, scheduleTaskRunStatusSchema, scheduleTaskSchema, scheduleTaskTargetKindSchema, scheduleTaskUpdateSchema, senderSchema, skillDescriptorSchema, skillScopeSchema, storedAttachmentSchema, workspaceSummarySchema };
