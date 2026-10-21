/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { getCurrentGuild } from "@utils/discord";
import definePlugin from "@utils/types";
import type { Role } from "@vencord/discord-types";
import {
    Button,
    GuildRoleStore,
    Menu,
    Modal,
    PermissionsBits,
    Text,
    openModal
} from "@webpack/common";

interface PermissionDifference {
    name: string;
    bit: bigint;
    firstHas: boolean;
    secondHas: boolean;
}

function permissionName(name: string): string {
    return name
        .replace(/^USE_/, "Use ")
        .replace(/^CREATE_/, "Create ")
        .replace(/^MANAGE_/, "Manage ")
        .replace(/^VIEW_/, "View ")
        .replace(/^SEND_/, "Send ")
        .replace(/^READ_/, "Read ")
        .replace(/^CHANGE_/, "Change ")
        .replace(/^MENTION_/, "Mention ")
        .replace(/^KICK_/, "Kick ")
        .replace(/^BAN_/, "Ban ")
        .replace(/^MODERATE_/, "Moderate ")
        .replace(/^ADD_/, "Add ")
        .replace(/^MOVE_/, "Move ")
        .replace(/^MUTE_/, "Mute ")
        .replace(/^DEAFEN_/, "Deafen ")
        .replace(/^PRIORITY_/, "Priority ")
        .replace(/^APPLICATION_/, "Application ")
        .replace(/^EXTERNAL_/, "External ")
        .replace(/^INSTANT_/, "Instant ")
        .replace(/^REQUEST_/, "Request ")
        .replace(/^SPEAK$/, "Speak")
        .replace(/^CONNECT$/, "Connect")
        .replace(/^STREAM$/, "Stream")
        .replace(/^ADMINISTRATOR$/, "Administrator")
        .replace(/^EMBED_LINKS$/, "Embed Links")
        .replace(/^ATTACH_FILES$/, "Attach Files")
        .replace(/^ADD_REACTIONS$/, "Add Reactions")
        .replace(/^PRIORITY_SPEAKER$/, "Priority Speaker")
        .replace(/^VIEW_AUDIT_LOG$/, "View Audit Log")
        .replace(/^MANAGE_GUILD$/, "Manage Server")
        .replace(/^MANAGE_CHANNELS$/, "Manage Channels")
        .replace(/^MANAGE_ROLES$/, "Manage Roles")
        .replace(/^MANAGE_WEBHOOKS$/, "Manage Webhooks")
        .replace(/^MANAGE_MESSAGES$/, "Manage Messages")
        .replace(/^READ_MESSAGE_HISTORY$/, "Read Message History")
        .replace(/^MENTION_EVERYONE$/, "Mention Everyone")
        .replace(/^USE_VAD$/, "Use Voice Activity")
        .replace(/^MANAGE_NICKNAMES$/, "Manage Nicknames")
        .replace(/^MANAGE_EVENTS$/, "Manage Events")
        .replace(/^MANAGE_THREADS$/, "Manage Threads")
        .replace(/^SEND_MESSAGES_IN_THREADS$/, "Send Messages in Threads")
        .replace(/^CREATE_PUBLIC_THREADS$/, "Create Public Threads")
        .replace(/^CREATE_PRIVATE_THREADS$/, "Create Private Threads")
        .replace(/^USE_EXTERNAL_STICKERS$/, "Use External Stickers")
        .replace(/^USE_APPLICATION_COMMANDS$/, "Use Application Commands")
        .replace(/^USE_SOUNDBOARD$/, "Use Soundboard")
        .replace(/^USE_EXTERNAL_SOUNDS$/, "Use External Sounds")
        .replace(/^SEND_VOICE_MESSAGES$/, "Send Voice Messages")
        .replace(/^_/g, "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, char => char.toUpperCase());
}

function getDifferences(
    first: Role,
    second: Role
): PermissionDifference[] {
    const firstPermissions = BigInt(first.permissions);
    const secondPermissions = BigInt(second.permissions);

    return Object.entries(PermissionsBits)
        .filter(
            (entry): entry is [string, bigint] =>
                typeof entry[1] === "bigint"
        )
        .map(([name, bit]) => {
            const firstHas = (firstPermissions & bit) === bit;
            const secondHas = (secondPermissions & bit) === bit;

            if (firstHas === secondHas)
                return null;

            return {
                name: permissionName(name),
                bit,
                firstHas,
                secondHas
            };
        })
        .filter(
            (permission): permission is PermissionDifference =>
                permission !== null
        );
}

function ComparisonModal({
    first,
    second,
    ...props
}: {
    first: Role;
    second: Role;
    onClose: () => void;
}) {
    const differences = getDifferences(first, second);

    return (
        <Modal
            {...props}
            title={`${first.name} vs ${second.name}`}
            size="small"
            transitionState={0}
        >
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    padding: "16px"
                }}
            >
                {differences.length === 0 ? (
                    <Text variant="text-md/normal">
                        These roles have the same permissions.
                    </Text>
                ) : (
                    <>
                        <Text variant="text-md/normal">
                            {differences.length} permission
                            {differences.length === 1 ? "" : "s"} differ.
                        </Text>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 110px 110px",
                                gap: "8px",
                                maxHeight: "400px",
                                overflowY: "auto"
                            }}
                        >
                            <Text variant="text-md/semibold">
                                Permission
                            </Text>

                            <Text variant="text-md/semibold">
                                {first.name}
                            </Text>

                            <Text variant="text-md/semibold">
                                {second.name}
                            </Text>

                            {differences.map(permission => (
                                <div
                                    key={permission.name}
                                    style={{
                                        display: "contents"
                                    }}
                                >
                                    <Text variant="text-md/normal">
                                        {permission.name}
                                    </Text>

                                    <Text variant="text-md/normal">
                                        {permission.firstHas
                                            ? "Allowed"
                                            : "Denied"}
                                    </Text>

                                    <Text variant="text-md/normal">
                                        {permission.secondHas
                                            ? "Allowed"
                                            : "Denied"}
                                    </Text>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                <div
                    style={{
                        display: "flex",
                        justifyContent: "flex-end"
                    }}
                >
                    <Button
                        look={Button.Looks.FILLED}
                        onClick={props.onClose}
                    >
                        Close
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

function openComparison(first: Role, second: Role) {
    openModal(props => (
        <ComparisonModal
            {...props}
            first={first}
            second={second}
        />
    ));
}

function RolePicker({
    firstRole,
    guildId,
    ...props
}: {
    firstRole: Role;
    guildId: string;
    onClose: () => void;
}) {
    const roles = GuildRoleStore
        .getSortedRoles(guildId)
        .filter(role => role.id !== firstRole.id);

    return (
        <Modal
            {...props}
            title={`Compare ${firstRole.name} with...`}
            size="small"
            transitionState={0}
        >
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    padding: "16px",
                    maxHeight: "500px",
                    overflowY: "auto"
                }}
            >
                {roles.map(role => (
                    <Button
                        key={role.id}
                        look={Button.Looks.FILLED}
                        onClick={() => {
                            props.onClose();
                            openComparison(firstRole, role);
                        }}
                    >
                        {role.name}
                    </Button>
                ))}

                {roles.length === 0 && (
                    <Text variant="text-md/normal">
                        There are no other roles to compare.
                    </Text>
                )}

                <Button
                    look={Button.Looks.FILLED}
                    onClick={props.onClose}
                >
                    Cancel
                </Button>
            </div>
        </Modal>
    );
}

function openRolePicker(guildId: string, role: Role) {
    openModal(props => (
        <RolePicker
            {...props}
            guildId={guildId}
            firstRole={role}
        />
    ));
}

export default definePlugin({
    name: "RolePermissionDiff",

    description: "Compare the permissions of two Discord roles.",

    authors: [
        {
            name: "Aces",
            id: 0n
        }
    ],

    tags: ["Roles", "Utility"],

    contextMenus: {
        "dev-context"(children, { id }: { id: string }) {
            const guild = getCurrentGuild();

            if (!guild)
                return;

            const role = GuildRoleStore.getRole(guild.id, id);

            if (!role)
                return;

            children.push(
                <Menu.MenuItem
                    id="role-permission-diff"
                    label="Compare Permissions"
                    action={() => {
                        openRolePicker(guild.id, role);
                    }}
                />
            );
        }
    }
});
