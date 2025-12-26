export interface CustomProductCategory {
    id: string
    name: string
    description?: string
    order_index: number
    is_primary: boolean
    is_active: boolean
    created_at: string
    updated_at: string
}

export interface CustomProductColumn {
    id: string
    category_id: string
    name: string
    description?: string
    order_index: number
    is_primary: boolean
    is_active: boolean
    created_at: string
    updated_at: string
}

export interface CustomProductOption {
    id: string
    column_id: string
    name: string
    description?: string
    order_index: number

    // Dimensions (in mm/cm)
    width?: number
    height?: number
    depth?: number

    // Calculated values
    area?: number      // width * height (mm²/cm²)
    volume?: number    // width * height * depth (mm³/cm³)

    // Pricing
    unit_price?: number
    total_price?: number  // area/volume * unit_price

    // Visuals
    image_url?: string
    image_urls?: string[]

    is_active: boolean
    created_at: string
    updated_at: string
}

export interface SelectedOption {
    column_id: string
    column_name: string
    option_id: string
    option_name: string
    quantity: number
    unit_price?: number
}

export interface CustomProduct {
    id: string
    name: string
    column_options: Record<string, SelectedOption>

    total_width?: number
    total_height?: number
    total_depth?: number
    total_description?: string

    total_price?: number
    quantity: number
    total_amount?: number
    image_urls?: string[]

    is_active: boolean
    created_at: string
    updated_at: string
}

export interface CreateCustomProductPayload {
    category_id: string
    name: string
    column_options: Record<string, SelectedOption>
    total_width?: number
    total_height?: number
    total_depth?: number
    total_description?: string
    total_price?: number
    quantity: number
    total_amount?: number
    image_urls?: string[]
}

export interface CustomProductStructure {
    id: string
    category_id: string
    name: string
    description?: string
    column_order: string[]
    separator: string
    is_default: boolean
    is_active: boolean
    created_at: string
    updated_at: string
}

export interface CreateCustomProductStructurePayload {
    category_id: string
    name: string
    description?: string
    column_order: string[]
    separator: string
    is_default: boolean
}
