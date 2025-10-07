"use server";

import * as storage from "../../../../server/storage";
import type { Character, CharacterInventoryItem, EquipmentSlot } from "@/types/character";

export async function updateAutoEquipPreference(
    userId: string, 
    isEnabled: boolean
): Promise<{ success: boolean; message: string }> {
    if (!userId) {
        return { success: false, message: "Пользователь не аутентифицирован." };
    }

    try {
        const charData = await storage.getCharacterById(userId);
        if (!charData) {
            throw new Error("Герой не найден.");
        }

        const character: Character = charData as any;
        if (!character.preferences) {
            character.preferences = {};
        }
        character.preferences.autoEquip = isEnabled;

        await storage.saveCharacter(character);

        const message = isEnabled ? "Автоматическая экипировка включена." : "Автоматическая экипировка выключена. Теперь вы можете управлять снаряжением вручную.";
        return { success: true, message };
    } catch (error: any) {
        return { success: false, message: error.message || "Не удалось обновить настройку." };
    }
}

export async function equipItem(
    userId: string,
    itemId: string,
    slot: EquipmentSlot
): Promise<{ success: boolean; message: string; character?: Character }> {
    if (!userId) {
        return { success: false, message: "Пользователь не аутентифицирован." };
    }
    
    try {
        const charData = await storage.getCharacterById(userId);
        if (!charData) {
            throw new Error("Герой не найден.");
        }

        let character: Character = charData as any;
        const itemToEquip = character.inventory.find(i => i.id === itemId);

        if (!itemToEquip || itemToEquip.equipmentSlot !== slot) {
            throw new Error("Предмет не найден или не может быть надет в этот слот.");
        }

        character.equippedItems[slot] = itemId;

        await storage.saveCharacter(character);
        return { success: true, message: `Предмет ${character.inventory.find(i => i.id === itemId)?.name} надет.`, character };

    } catch (e: any) {
        console.error("Error equipping item:", e);
        return { success: false, message: e.message || "Не удалось надеть предмет." };
    }
}

export async function clearInventory(
    userId: string
): Promise<{ success: boolean; message: string; character?: Character }> {
    if (!userId) {
        return { success: false, message: "Пользователь не аутентифицирован." };
    }

    try {
        const charData = await storage.getCharacterById(userId);
        if (!charData) {
            throw new Error("Герой не найден.");
        }

        let character: Character = charData as any;

        const goldItem = character.inventory.find(i => i.id === 'gold');
        character.inventory = goldItem ? [goldItem] : [{ id: 'gold', name: 'Золото', type: 'gold', quantity: 0, weight: 0 }];

        character.equippedItems = {};

        await storage.saveCharacter(character);
        return { success: true, message: "Инвентарь героя был успешно очищен.", character };

    } catch (e: any) {
        console.error("Error clearing inventory:", e);
        return { success: false, message: e.message || "Не удалось очистить инвентарь." };
    }
}
