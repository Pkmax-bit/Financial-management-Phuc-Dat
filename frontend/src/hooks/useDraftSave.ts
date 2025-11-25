'use client'

import { useEffect } from 'react'

const DEBOUNCE_MS = 1000

export interface DraftData {
    data: any
    savedAt: string
}

export const useDraftSave = (formData: any, draftKey: string = 'project_draft') => {
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            try {
                const draftData: DraftData = {
                    data: formData,
                    savedAt: new Date().toISOString()
                }
                localStorage.setItem(draftKey, JSON.stringify(draftData))
                console.log('✅ Draft saved to localStorage')
            } catch (error) {
                console.error('❌ Failed to save draft:', error)
            }
        }, DEBOUNCE_MS)

        return () => {
            clearTimeout(timeoutId)
        }
    }, [formData, draftKey])
}

export const loadDraft = (draftKey: string = 'project_draft'): DraftData | null => {
    try {
        const draft = localStorage.getItem(draftKey)
        if (draft) {
            const parsed = JSON.parse(draft) as DraftData
            return parsed
        }
    } catch (error) {
        console.error('❌ Failed to load draft:', error)
    }
    return null
}

export const clearDraft = (draftKey: string = 'project_draft') => {
    try {
        localStorage.removeItem(draftKey)
        console.log('✅ Draft cleared')
    } catch (error) {
        console.error('❌ Failed to clear draft:', error)
    }
}
