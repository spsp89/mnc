import 'package:bnc_mobile/core/data/app_repository.dart';
import 'package:bnc_mobile/core/models/models.dart';
import 'package:bnc_mobile/core/state/app_state.dart';
import 'package:bnc_mobile/design_system/bnc_theme.dart';
import 'package:bnc_mobile/design_system/components.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class ConversationsScreen extends ConsumerWidget {
  const ConversationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(sessionProvider);
    final state = ref.watch(conversationsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Messages')),
      body: !session.authenticated
          ? EmptyState(
              icon: Icons.chat_bubble_outline_rounded,
              title: 'Sign in to see conversations',
              body:
                  'Messages from businesses and enquiry responses stay connected to your BNC account.',
              action: () => context.push(
                '/login?returnTo=${Uri.encodeQueryComponent('/messages')}',
              ),
              actionLabel: 'Log in',
            )
          : state.when(
              loading: () => ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: 4,
                separatorBuilder: (_, index) => const SizedBox(height: 10),
                itemBuilder: (_, index) => const BncSkeleton(height: 78),
              ),
              error: (error, stack) => ErrorState(
                error: error,
                onRetry: () => ref.invalidate(conversationsProvider),
              ),
              data: (items) => items.isEmpty
                  ? const EmptyState(
                      icon: Icons.forum_outlined,
                      title: 'No conversations yet',
                      body:
                          'Business responses and direct conversations will appear here.',
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
                      itemCount: items.length,
                      separatorBuilder: (_, index) => const Divider(),
                      itemBuilder: (context, index) {
                        final conversation = items[index];
                        return ListTile(
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 4,
                            vertical: 7,
                          ),
                          onTap: () => context.push(
                            '/messages/${conversation.id}',
                            extra: conversation,
                          ),
                          leading: CircleAvatar(
                            radius: 27,
                            backgroundColor: BncColors.brand.withValues(
                              alpha: .1,
                            ),
                            child: Text(
                              initials(conversation.title),
                              style: const TextStyle(
                                color: BncColors.brand,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                          title: Text(
                            conversation.title,
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          subtitle: Text(
                            conversation.lastMessage,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          trailing: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                conversation.updatedAt,
                                style: Theme.of(context).textTheme.labelSmall
                                    ?.copyWith(color: BncColors.muted),
                              ),
                              if (conversation.unread > 0) ...[
                                const SizedBox(height: 6),
                                Badge(label: Text('${conversation.unread}')),
                              ],
                            ],
                          ),
                        );
                      },
                    ),
            ),
    );
  }
}

final chatMessagesProvider = FutureProvider.family<List<ChatMessage>, String>(
  (ref, conversationId) =>
      ref.watch(appRepositoryProvider).messages(conversationId),
);

class ChatScreen extends ConsumerStatefulWidget {
  const ChatScreen({
    required this.conversationId,
    super.key,
    this.conversation,
  });

  final String conversationId;
  final Conversation? conversation;

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final _controller = TextEditingController();
  final List<ChatMessage> _sent = [];
  bool _sending = false;

  @override
  void initState() {
    super.initState();
    Future<void>.microtask(() async {
      await ref
          .read(appRepositoryProvider)
          .markConversationRead(widget.conversationId);
      ref.invalidate(conversationsProvider);
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final body = _controller.text.trim();
    if (body.isEmpty || _sending) return;
    setState(() => _sending = true);
    try {
      final message = await ref
          .read(appRepositoryProvider)
          .sendMessage(widget.conversationId, body);
      _controller.clear();
      setState(() => _sent.add(message));
    } on Object catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('$error')));
      }
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  Future<void> _handleAction(String value) async {
    if (value == 'archive') {
      await ref
          .read(appRepositoryProvider)
          .archiveConversation(widget.conversationId);
      ref.invalidate(conversationsProvider);
      if (mounted) context.pop();
      return;
    }
    if (value == 'block') {
      final businessId = widget.conversation?.businessId ?? '';
      if (businessId.isEmpty) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('This conversation has no business to block.'),
            ),
          );
        }
        return;
      }
      await ref
          .read(appRepositoryProvider)
          .blockBusiness(
            businessId,
            reason: 'Blocked from conversation ${widget.conversationId}',
          );
      if (mounted) context.pop();
      return;
    }
    if (value == 'report' && mounted) {
      context.push(
        '/report-abuse?business=${Uri.encodeQueryComponent(widget.conversation?.title ?? 'conversation')}',
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(chatMessagesProvider(widget.conversationId));
    final title = widget.conversation?.title ?? 'Conversation';
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            CircleAvatar(
              radius: 18,
              backgroundColor: BncColors.brand.withValues(alpha: .1),
              child: Text(
                initials(title),
                style: const TextStyle(
                  color: BncColors.brand,
                  fontWeight: FontWeight.w800,
                  fontSize: 12,
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, maxLines: 1),
                  Text(
                    'BNC conversation',
                    style: Theme.of(
                      context,
                    ).textTheme.labelSmall?.copyWith(color: BncColors.muted),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          PopupMenuButton<String>(
            onSelected: _handleAction,
            itemBuilder: (context) => const [
              PopupMenuItem(value: 'archive', child: Text('Archive')),
              PopupMenuItem(value: 'block', child: Text('Block business')),
              PopupMenuItem(
                value: 'report',
                child: Text('Report conversation'),
              ),
            ],
          ),
        ],
      ),
      body: Column(
        children: [
          Container(
            width: double.infinity,
            color: BncColors.sky,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.lock_outline_rounded,
                  size: 15,
                  color: BncColors.verified,
                ),
                SizedBox(width: 6),
                Flexible(
                  child: Text(
                    'Keep payments and sensitive details within trusted channels.',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 12, color: BncColors.deepBlue),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: state.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, stack) => ErrorState(error: error),
              data: (items) {
                final messages = [...items, ..._sent];
                return ListView.builder(
                  reverse: true,
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 10),
                  itemCount: messages.length,
                  itemBuilder: (context, reverseIndex) {
                    final message =
                        messages[messages.length - reverseIndex - 1];
                    return _MessageBubble(message: message);
                  },
                );
              },
            ),
          ),
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(12, 8, 12, 10),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Expanded(
                    child: TextField(
                      controller: _controller,
                      minLines: 1,
                      maxLines: 5,
                      maxLength: 4000,
                      textCapitalization: TextCapitalization.sentences,
                      decoration: const InputDecoration(
                        hintText: 'Write a message…',
                        counterText: '',
                        contentPadding: EdgeInsets.symmetric(
                          horizontal: 15,
                          vertical: 12,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 7),
                  IconButton.filled(
                    onPressed: _sending ? null : _send,
                    icon: _sending
                        ? const SizedBox.square(
                            dimension: 18,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2,
                            ),
                          )
                        : const Icon(Icons.send_rounded),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  const _MessageBubble({required this.message});

  final ChatMessage message;

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: message.mine ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        constraints: BoxConstraints(
          maxWidth: MediaQuery.sizeOf(context).width * .78,
        ),
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.fromLTRB(14, 10, 14, 8),
        decoration: BoxDecoration(
          color: message.mine
              ? BncColors.brand
              : Theme.of(context).colorScheme.surfaceContainerHighest,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(17),
            topRight: const Radius.circular(17),
            bottomLeft: Radius.circular(message.mine ? 17 : 4),
            bottomRight: Radius.circular(message.mine ? 4 : 17),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              message.body,
              style: TextStyle(
                color: message.mine
                    ? Colors.white
                    : Theme.of(context).colorScheme.onSurface,
                height: 1.35,
              ),
            ),
            const SizedBox(height: 3),
            Text(
              message.sentAt,
              style: TextStyle(
                color: message.mine ? Colors.white70 : BncColors.muted,
                fontSize: 10,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
