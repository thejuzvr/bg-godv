"use server";

import * as storage from "../../../../server/storage";
import type { Character, CharacterAttributes, CharacterSkills } from "@/types/character";
import { allPerks } from "@/data/perks";

export async function updateStats(
    userId: string,
    newAttributes: CharacterAttributes,
    newSkills: CharacterSkills,
    pointsSpent: { attribute: number; skill: number }
): Promise<{ success: boolean; message: string }> {
    if (!userId) {
        return { success: false, message: "Высшие силы не могут найти вашу душу. Попробуйте войти снова." };
    }

    try {
        const charData = await storage.getCharacterById(userId);
        if (!charData) {
            throw new Error("Герой не найден в анналах истории.");
        }

        const character: Character = charData as any;

        if (character.points.attribute < pointsSpent.attribute || character.points.skill < pointsSpent.skill) {
            throw new Error("Недостаточно очков для распределения.");
        }

        let updatedCharacter: Character = structuredClone(character);
        
        updatedCharacter.attributes = newAttributes;
        updatedCharacter.skills = newSkills;
        updatedCharacter.points.attribute -= pointsSpent.attribute;
        updatedCharacter.points.skill -= pointsSpent.skill;

        // Recalculate max stats based on new attributes
        updatedCharacter.stats.health.max = 80 + newAttributes.endurance * 10;
        updatedCharacter.stats.magicka.max = 80 + newAttributes.intelligence * 10;
        updatedCharacter.stats.stamina.max = 80 + (newAttributes.strength + newAttributes.endurance) * 5;

        // Check for new perks
        const currentPerks = updatedCharacter.unlockedPerks || [];
        const newlyUnlockedPerks = allPerks.filter(perk =>
            !currentPerks.includes(perk.id) &&
            updatedCharacter.skills[perk.skill] >= perk.requiredSkillLevel
        ).map(p => p.id);

        if (newlyUnlockedPerks.length > 0) {
            if (!updatedCharacter.unlockedPerks) {
                updatedCharacter.unlockedPerks = [];
            }
            updatedCharacter.unlockedPerks.push(...newlyUnlockedPerks);
        }

        await storage.saveCharacter(updatedCharacter);

        return { success: true, message: "Характеристики и навыки успешно обновлены!" };
    } catch (e: any) {
        return { success: false, message: e.message || "Транзакция не удалась. Силы небесные в смятении." };
    }
}

export async function updateAutoAssignPreference(
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
        character.preferences.autoAssignPoints = isEnabled;

        await storage.saveCharacter(character);

        const message = isEnabled ? "Автоматическое распределение очков включено." : "Автоматическое распределение очков выключено.";
        return { success: true, message };
    } catch (error: any) {
        return { success: false, message: error.message || "Не удалось обновить настройку." };
    }
}
