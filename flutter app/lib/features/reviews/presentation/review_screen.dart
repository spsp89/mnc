import 'package:bnc_mobile/core/data/app_repository.dart';
import 'package:bnc_mobile/core/models/models.dart';
import 'package:bnc_mobile/design_system/bnc_theme.dart';
import 'package:bnc_mobile/design_system/components.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final reviewBusinessProvider = FutureProvider.family<Business, String>(
  (ref, slug) => ref.watch(appRepositoryProvider).business(slug),
);

class ReviewEntryScreen extends ConsumerWidget {
  const ReviewEntryScreen({this.business, this.businessSlug, super.key});

  final Business? business;
  final String? businessSlug;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final initial = business;
    if (initial != null) return ReviewScreen(business: initial);
    final slug = businessSlug?.trim() ?? '';
    if (slug.isEmpty) {
      return const Scaffold(
        body: SafeArea(
          child: EmptyState(
            icon: Icons.storefront_outlined,
            title: 'Choose a business first',
            body: 'Open a business profile before writing a review.',
          ),
        ),
      );
    }
    return ref
        .watch(reviewBusinessProvider(slug))
        .when(
          loading: () =>
              const Scaffold(body: Center(child: CircularProgressIndicator())),
          error: (error, stack) => Scaffold(
            appBar: AppBar(),
            body: ErrorState(
              error: error,
              onRetry: () => ref.invalidate(reviewBusinessProvider(slug)),
            ),
          ),
          data: (business) => ReviewScreen(business: business),
        );
  }
}

class ReviewScreen extends ConsumerStatefulWidget {
  const ReviewScreen({required this.business, super.key});

  final Business business;

  @override
  ConsumerState<ReviewScreen> createState() => _ReviewScreenState();
}

class _ReviewScreenState extends ConsumerState<ReviewScreen> {
  final _controller = TextEditingController();
  int _rating = 5;
  bool _submitting = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_controller.text.trim().length < 20) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Write at least 20 helpful characters.')),
      );
      return;
    }
    setState(() => _submitting = true);
    try {
      await ref
          .read(appRepositoryProvider)
          .createReview(
            businessId: widget.business.id,
            rating: _rating,
            body: _controller.text.trim(),
          );
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Thanks—your review was submitted for publishing.'),
          ),
        );
      }
    } on Object catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('$error')));
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Write a review')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                widget.business.name,
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              const SizedBox(height: 8),
              Text(
                'Share specific, first-hand feedback that helps local customers choose.',
                style: Theme.of(
                  context,
                ).textTheme.bodyLarge?.copyWith(color: BncColors.muted),
              ),
              const SizedBox(height: 28),
              Text(
                'Your rating',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 8),
              Row(
                children: List.generate(
                  5,
                  (index) => IconButton(
                    onPressed: () => setState(() => _rating = index + 1),
                    iconSize: 38,
                    tooltip: '${index + 1} stars',
                    icon: Icon(
                      index < _rating
                          ? Icons.star_rounded
                          : Icons.star_border_rounded,
                      color: const Color(0xFFF5A623),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 18),
              TextField(
                controller: _controller,
                minLines: 6,
                maxLines: 10,
                maxLength: 3000,
                textCapitalization: TextCapitalization.sentences,
                decoration: const InputDecoration(
                  labelText: 'What was your experience?',
                  alignLabelWithHint: true,
                  hintText:
                      'Consider communication, quality, timing and value…',
                ),
              ),
              const SizedBox(height: 14),
              Card(
                color: BncColors.sky,
                child: const Padding(
                  padding: EdgeInsets.all(16),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(Icons.shield_outlined, color: BncColors.verified),
                      SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'Do not include phone numbers, private addresses or sensitive personal information.',
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 22),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _submitting ? null : _submit,
                  child: _submitting
                      ? const SizedBox.square(
                          dimension: 20,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                      : const Text('Submit review'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
