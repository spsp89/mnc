part of 'home_screen.dart';

class _AutoScrollingList extends StatefulWidget {
  const _AutoScrollingList({
    required this.height,
    required this.itemCount,
    required this.itemBuilder,
    required this.separatorBuilder,
    this.padding,
    this.step = 260,
  });

  final double height;
  final int itemCount;
  final IndexedWidgetBuilder itemBuilder;
  final IndexedWidgetBuilder separatorBuilder;
  final EdgeInsetsGeometry? padding;
  final double step;

  @override
  State<_AutoScrollingList> createState() => _AutoScrollingListState();
}

class _AutoScrollingListState extends State<_AutoScrollingList> {
  final ScrollController _controller = ScrollController();
  Timer? _timer;
  Timer? _resumeTimer;
  bool _manuallyScrolling = false;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 4), (_) => _advance());
  }

  void _advance() {
    if (!mounted || _manuallyScrolling || !_controller.hasClients) return;
    final position = _controller.position;
    if (position.maxScrollExtent <= 0 ||
        MediaQuery.maybeOf(context)?.disableAnimations == true) {
      return;
    }
    final atEnd = position.pixels >= position.maxScrollExtent - 8;
    _controller.animateTo(
      atEnd
          ? 0
          : (position.pixels + widget.step).clamp(0, position.maxScrollExtent),
      duration: const Duration(milliseconds: 520),
      curve: Curves.easeOutCubic,
    );
  }

  bool _handleScroll(ScrollNotification notification) {
    if (notification is ScrollStartNotification &&
        notification.dragDetails != null) {
      _resumeTimer?.cancel();
      _manuallyScrolling = true;
    } else if (notification is ScrollEndNotification && _manuallyScrolling) {
      _resumeTimer?.cancel();
      _resumeTimer = Timer(const Duration(seconds: 7), () {
        if (mounted) _manuallyScrolling = false;
      });
    }
    return false;
  }

  @override
  void dispose() {
    _timer?.cancel();
    _resumeTimer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: widget.height,
      child: NotificationListener<ScrollNotification>(
        onNotification: _handleScroll,
        child: ListView.separated(
          controller: _controller,
          padding: widget.padding,
          scrollDirection: Axis.horizontal,
          itemCount: widget.itemCount,
          separatorBuilder: widget.separatorBuilder,
          itemBuilder: widget.itemBuilder,
        ),
      ),
    );
  }
}

class _HomePromotionCarousel extends StatefulWidget {
  const _HomePromotionCarousel({
    required this.businesses,
    required this.onOpen,
  });

  final AsyncValue<List<Business>> businesses;
  final ValueChanged<String> onOpen;

  @override
  State<_HomePromotionCarousel> createState() => _HomePromotionCarouselState();
}

class _HomePromotionCarouselState extends State<_HomePromotionCarousel> {
  final PageController _controller = PageController();
  Timer? _timer;
  int _page = 0;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(milliseconds: 4800), (_) {
      final items = widget.businesses.valueOrNull ?? const <Business>[];
      if (!mounted ||
          items.length < 2 ||
          !_controller.hasClients ||
          MediaQuery.maybeOf(context)?.disableAnimations == true) {
        return;
      }
      final next = (_page + 1) % items.take(6).length;
      _controller.animateToPage(
        next,
        duration: const Duration(milliseconds: 520),
        curve: Curves.easeOutCubic,
      );
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final items = (widget.businesses.valueOrNull ?? const <Business>[])
        .take(6)
        .toList();
    return Container(
      height: 176,
      color: BncColors.brand,
      child: items.isEmpty
          ? const BncSkeleton(height: 176, radius: 0)
          : Stack(
              fit: StackFit.expand,
              children: [
                PageView.builder(
                  controller: _controller,
                  itemCount: items.length,
                  onPageChanged: (page) => setState(() => _page = page),
                  itemBuilder: (context, index) {
                    final business = items[index];
                    return Semantics(
                      button: true,
                      label: 'Featured poster for ${business.name}',
                      child: InkWell(
                        onTap: () => widget.onOpen(business.slug),
                        child: Stack(
                          fit: StackFit.expand,
                          children: [
                            BncNetworkImage(url: business.coverImageUrl),
                            const DecoratedBox(
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  begin: Alignment.centerLeft,
                                  end: Alignment.centerRight,
                                  colors: [
                                    Color(0xF207216D),
                                    Color(0xC20F48D8),
                                    Color(0x260F48D8),
                                  ],
                                  stops: [0, .55, 1],
                                ),
                              ),
                            ),
                            Padding(
                              padding: const EdgeInsets.fromLTRB(
                                20,
                                22,
                                120,
                                28,
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(
                                    business.category.toUpperCase(),
                                    style: Theme.of(context)
                                        .textTheme
                                        .labelSmall
                                        ?.copyWith(
                                          color: const Color(0xFFBFD7FF),
                                          fontWeight: FontWeight.w900,
                                          letterSpacing: 1,
                                        ),
                                  ),
                                  const SizedBox(height: 5),
                                  Text(
                                    business.name,
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: Theme.of(context)
                                        .textTheme
                                        .headlineMedium
                                        ?.copyWith(
                                          color: Colors.white,
                                          height: 1,
                                        ),
                                  ),
                                  const SizedBox(height: 7),
                                  Text(
                                    business.offer?.discount ??
                                        'Discover what is available nearby',
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: Theme.of(context).textTheme.bodySmall
                                        ?.copyWith(color: Colors.white70),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
                Positioned(
                  right: 20,
                  bottom: 16,
                  left: 20,
                  child: Row(
                    children: List.generate(
                      items.length,
                      (index) => Expanded(
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 220),
                          height: index == _page ? 4 : 2,
                          margin: EdgeInsets.only(
                            right: index == items.length - 1 ? 0 : 5,
                          ),
                          decoration: BoxDecoration(
                            color: index == _page
                                ? Colors.white
                                : Colors.white.withValues(alpha: .38),
                            borderRadius: BorderRadius.circular(99),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
    );
  }
}

class _HomeSectionNotice extends StatelessWidget {
  const _HomeSectionNotice({
    required this.icon,
    required this.title,
    required this.body,
    this.actionLabel,
    this.onAction,
    this.margin = const EdgeInsets.fromLTRB(18, 12, 18, 2),
  });

  final IconData icon;
  final String title;
  final String body;
  final String? actionLabel;
  final VoidCallback? onAction;
  final EdgeInsetsGeometry margin;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: margin,
      padding: const EdgeInsets.fromLTRB(14, 13, 10, 13),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F6FF),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFD8E6FF)),
      ),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: BncColors.brand.withValues(alpha: .1),
              borderRadius: BorderRadius.circular(13),
            ),
            child: Icon(icon, color: BncColors.brand, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.titleSmall,
                ),
                const SizedBox(height: 3),
                Text(
                  body,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(
                    context,
                  ).textTheme.bodySmall?.copyWith(color: BncColors.muted),
                ),
              ],
            ),
          ),
          if (actionLabel != null && onAction != null)
            TextButton(onPressed: onAction, child: Text(actionLabel!)),
        ],
      ),
    );
  }
}

class _PopularSearches extends StatelessWidget {
  const _PopularSearches({required this.onSearch});

  final ValueChanged<String> onSearch;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: BncColors.border)),
      ),
      padding: const EdgeInsets.fromLTRB(18, 11, 0, 11),
      child: _AutoScrollingList(
        height: 36,
        itemCount: _popularSearches.length + 1,
        step: 150,
        separatorBuilder: (_, index) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          if (index == 0) {
            return const Row(
              children: [
                Icon(
                  Icons.trending_up_rounded,
                  color: BncColors.brand,
                  size: 18,
                ),
                SizedBox(width: 6),
                Text(
                  'Popular',
                  style: TextStyle(
                    color: BncColors.deepBlue,
                    fontWeight: FontWeight.w800,
                    fontSize: 12,
                  ),
                ),
              ],
            );
          }
          final query = _popularSearches[index - 1];
          return ActionChip(
            visualDensity: VisualDensity.compact,
            side: const BorderSide(color: Color(0xFFDCE5F5)),
            backgroundColor: BncColors.sky,
            label: Text(query),
            onPressed: () => onSearch(query),
          );
        },
      ),
    );
  }
}

class _DiscoveryPaths extends StatelessWidget {
  const _DiscoveryPaths({
    required this.onMarketplace,
    required this.onServices,
  });

  final VoidCallback onMarketplace;
  final VoidCallback onServices;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 158,
      child: Row(
        children: [
          Expanded(
            child: _DiscoveryPathCard(
              icon: Icons.shopping_bag_rounded,
              kicker: 'SHOP LOCAL',
              title: 'Shops &\nproducts',
              onTap: onMarketplace,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: _DiscoveryPathCard(
              icon: Icons.support_agent_rounded,
              kicker: 'GET EXPERT HELP',
              title: 'Services &\nexperts',
              onTap: onServices,
            ),
          ),
        ],
      ),
    );
  }
}

class _DiscoveryPathCard extends StatelessWidget {
  const _DiscoveryPathCard({
    required this.icon,
    required this.kicker,
    required this.title,
    required this.onTap,
  });

  final IconData icon;
  final String kicker;
  final String title;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFDCE5F5)),
        boxShadow: [
          BoxShadow(
            color: BncColors.deepBlue.withValues(alpha: .06),
            blurRadius: 14,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(20),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: BncColors.brand.withValues(alpha: .09),
                        borderRadius: BorderRadius.circular(13),
                      ),
                      child: Icon(icon, color: BncColors.brand, size: 21),
                    ),
                    const Spacer(),
                    Container(
                      width: 28,
                      height: 28,
                      alignment: Alignment.center,
                      decoration: const BoxDecoration(
                        color: BncColors.sky,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.arrow_outward_rounded,
                        color: BncColors.brand,
                        size: 17,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  kicker,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: BncColors.brand,
                    fontSize: 9,
                    letterSpacing: .8,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    color: BncColors.ink,
                    fontSize: 19,
                    height: 1.05,
                  ),
                ),
                const Spacer(),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _NearbyFilters extends StatelessWidget {
  const _NearbyFilters({
    required this.selectedRadius,
    required this.onRadius,
    required this.onOpenNow,
    required this.onOffers,
    required this.onMap,
  });

  final int selectedRadius;
  final ValueChanged<int> onRadius;
  final VoidCallback onOpenNow;
  final VoidCallback onOffers;
  final VoidCallback onMap;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 43,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 18),
        children: [
          for (final radius in const [3, 5, 10, 25]) ...[
            ChoiceChip(
              avatar: Icon(
                radius == selectedRadius
                    ? Icons.location_on_rounded
                    : Icons.location_on_outlined,
                size: 17,
              ),
              label: Text('$radius km'),
              selected: radius == selectedRadius,
              onSelected: (_) => onRadius(radius),
            ),
            const SizedBox(width: 8),
          ],
          ActionChip(
            avatar: const Icon(Icons.schedule_rounded, size: 17),
            label: const Text('Open now'),
            onPressed: onOpenNow,
          ),
          const SizedBox(width: 8),
          ActionChip(
            avatar: const Icon(Icons.local_offer_outlined, size: 17),
            label: const Text('Has offers'),
            onPressed: onOffers,
          ),
          const SizedBox(width: 8),
          ActionChip(
            avatar: const Icon(Icons.map_outlined, size: 17),
            label: const Text('Map'),
            onPressed: onMap,
          ),
        ],
      ),
    );
  }
}

class _NearbyBusinessCard extends ConsumerWidget {
  const _NearbyBusinessCard({required this.business});

  final Business business;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final saved = ref.watch(savedProvider).contains(business.id);
    return SizedBox(
      width: 300,
      child: Card(
        clipBehavior: Clip.antiAlias,
        child: Column(
          children: [
            InkWell(
              onTap: () => context.push('/business/${business.slug}'),
              child: SizedBox(
                height: 104,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    BncNetworkImage(url: business.coverImageUrl),
                    const DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [Colors.black45, Colors.transparent],
                        ),
                      ),
                    ),
                    Positioned(
                      left: 10,
                      top: 10,
                      child: Wrap(
                        spacing: 5,
                        children: [
                          if (business.bncStarLevel > 0)
                            StatusBadge(
                              label: bncMembershipLabel(
                                business.bncStarLevel,
                                business.planName,
                              ),
                              color: BncColors.deepBlue,
                            ),
                          if (business.offer != null)
                            StatusBadge(
                              label: business.offer!.discount,
                              color: BncColors.offer,
                            ),
                        ],
                      ),
                    ),
                    Positioned(
                      right: 8,
                      top: 7,
                      child: Material(
                        color: Colors.white.withValues(alpha: .94),
                        shape: const CircleBorder(),
                        child: IconButton(
                          visualDensity: VisualDensity.compact,
                          onPressed: () async {
                            if (!ref.read(sessionProvider).authenticated) {
                              context.push(
                                '/login?returnTo=${Uri.encodeQueryComponent('/business/${business.slug}')}',
                              );
                              return;
                            }
                            try {
                              await ref
                                  .read(savedProvider.notifier)
                                  .toggle(business.id);
                            } on Object catch (error) {
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(content: Text('$error')),
                                );
                              }
                            }
                          },
                          icon: Icon(
                            saved
                                ? Icons.bookmark_rounded
                                : Icons.bookmark_border_rounded,
                            color: saved ? BncColors.brand : BncColors.ink,
                            size: 20,
                          ),
                          tooltip: saved ? 'Remove from saved' : 'Save',
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(13, 8, 13, 7),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                business.category.toUpperCase(),
                                style: Theme.of(context).textTheme.labelSmall
                                    ?.copyWith(
                                      color: BncColors.brand,
                                      fontSize: 9,
                                      fontWeight: FontWeight.w900,
                                      letterSpacing: .6,
                                    ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                business.name,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: Theme.of(context).textTheme.titleMedium,
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 5,
                          ),
                          decoration: BoxDecoration(
                            color: BncColors.brand,
                            borderRadius: BorderRadius.circular(99),
                          ),
                          child: Row(
                            children: [
                              const Icon(
                                Icons.star_rounded,
                                color: Colors.white,
                                size: 14,
                              ),
                              const SizedBox(width: 3),
                              Text(
                                business.rating.toStringAsFixed(1),
                                style: Theme.of(context).textTheme.labelSmall
                                    ?.copyWith(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w900,
                                    ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 7),
                    Row(
                      children: [
                        const Icon(
                          Icons.location_on_outlined,
                          color: BncColors.muted,
                          size: 15,
                        ),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            [
                              business.locality,
                              if (business.distanceKm != null)
                                '${business.distanceKm!.toStringAsFixed(1)} km',
                            ].where((value) => value.isNotEmpty).join(' · '),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: Theme.of(context).textTheme.labelSmall
                                ?.copyWith(color: BncColors.muted),
                          ),
                        ),
                        Container(
                          width: 6,
                          height: 6,
                          decoration: BoxDecoration(
                            color: business.openNow
                                ? BncColors.verified
                                : business.hoursKnown
                                ? BncColors.muted
                                : BncColors.brand,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          business.availabilityLabel,
                          style: Theme.of(context).textTheme.labelSmall
                              ?.copyWith(
                                color: business.openNow
                                    ? BncColors.verified
                                    : business.hoursKnown
                                    ? BncColors.muted
                                    : BncColors.brand,
                                fontWeight: FontWeight.w800,
                              ),
                        ),
                      ],
                    ),
                    if (business.permanentDiscountPercent > 0) ...[
                      const SizedBox(height: 5),
                      Text(
                        [
                          '${business.permanentDiscountPercent}% permanent discount',
                          if (business.permanentDiscountLabel.isNotEmpty)
                            business.permanentDiscountLabel,
                        ].join(' · '),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: BncColors.brand,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ],
                    const Spacer(),
                    Row(
                      children: [
                        if (business.phone.trim().isNotEmpty)
                          _BusinessAction(
                            icon: Icons.phone_outlined,
                            label: 'Call',
                            onTap: () => _launchHomeUrl(
                              context,
                              'tel:${business.phone}',
                            ),
                          ),
                        _BusinessAction(
                          icon: Icons.chat_bubble_outline_rounded,
                          label: 'BNC chat',
                          onTap: () async {
                            if (!ref.read(sessionProvider).authenticated) {
                              context.push(
                                '/login?returnTo=${Uri.encodeQueryComponent('/business/${business.slug}')}',
                              );
                              return;
                            }
                            try {
                              final conversationId = await ref
                                  .read(appRepositoryProvider)
                                  .startBusinessConversation(
                                    business.id,
                                    'Hi, I found ${business.name} on BNC and would like more information.',
                                  );
                              if (context.mounted) {
                                context.push('/messages/$conversationId');
                              }
                            } on Object catch (error) {
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(content: Text('$error')),
                                );
                              }
                            }
                          },
                        ),
                        _BusinessAction(
                          icon: Icons.near_me_outlined,
                          label: 'Map',
                          onTap: () => _launchHomeUrl(
                            context,
                            'https://www.google.com/maps/search/?api=1&query='
                            '${business.latitude},${business.longitude}',
                          ),
                        ),
                        const Spacer(),
                        TextButton(
                          onPressed: () =>
                              context.push('/business/${business.slug}'),
                          child: const Text('Details →'),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _BusinessAction extends StatelessWidget {
  const _BusinessAction({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return IconButton(
      visualDensity: VisualDensity.compact,
      onPressed: onTap,
      icon: Icon(icon, size: 18),
      tooltip: label,
      color: BncColors.brand,
    );
  }
}

class _WebsiteFeatureShortcuts extends StatelessWidget {
  const _WebsiteFeatureShortcuts({
    required this.onBusinesses,
    required this.onProducts,
    required this.onServices,
    required this.onOffers,
    required this.onJobs,
    required this.onBookings,
    required this.onWeeklyDraw,
    required this.onLocations,
  });

  final VoidCallback onBusinesses;
  final VoidCallback onProducts;
  final VoidCallback onServices;
  final VoidCallback onOffers;
  final VoidCallback onJobs;
  final VoidCallback onBookings;
  final VoidCallback onWeeklyDraw;
  final VoidCallback onLocations;

  @override
  Widget build(BuildContext context) {
    final items = [
      ('Businesses', Icons.storefront_outlined, onBusinesses),
      ('Products', Icons.shopping_bag_outlined, onProducts),
      ('Services', Icons.home_repair_service_outlined, onServices),
      ('Offers', Icons.local_offer_outlined, onOffers),
      ('Jobs', Icons.work_outline_rounded, onJobs),
      ('Bookings', Icons.event_available_outlined, onBookings),
      ('Weekly Draw', Icons.celebration_outlined, onWeeklyDraw),
      ('Locations', Icons.location_city_outlined, onLocations),
    ];
    return _AutoScrollingList(
      height: 76,
      padding: const EdgeInsets.fromLTRB(18, 11, 18, 7),
      itemCount: items.length,
      step: 150,
      separatorBuilder: (_, index) => const SizedBox(width: 8),
      itemBuilder: (context, index) {
        final item = items[index];
        return Material(
          color: const Color(0xFFEAF2FF),
          borderRadius: BorderRadius.circular(16),
          child: InkWell(
            onTap: item.$3,
            borderRadius: BorderRadius.circular(16),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 13),
              child: Row(
                children: [
                  Icon(item.$2, color: BncColors.brand, size: 19),
                  const SizedBox(width: 7),
                  Text(
                    item.$1,
                    style: Theme.of(context).textTheme.labelMedium?.copyWith(
                      color: BncColors.deepBlue,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

class _DealsSection extends StatefulWidget {
  const _DealsSection({required this.offers, required this.onViewAll});

  final AsyncValue<List<Offer>> offers;
  final VoidCallback onViewAll;

  @override
  State<_DealsSection> createState() => _DealsSectionState();
}

class _DealsSectionState extends State<_DealsSection> {
  int _tab = 0;

  @override
  Widget build(BuildContext context) {
    final tabs = ['Nearby', 'Popular', 'Ending soon', 'Exclusive'];
    final offers = widget.offers.valueOrNull ?? const <Offer>[];
    final ordered = switch (_tab) {
      1 => offers.reversed.toList(),
      2 => [...offers]..sort((a, b) => a.expiresAt.compareTo(b.expiresAt)),
      3 => offers.where((offer) => offer.code != null).toList(),
      _ => offers,
    };
    final visible = ordered.isEmpty ? offers : ordered;

    return DecoratedBox(
      decoration: BoxDecoration(
        color: const Color(0xFFF0F6FF),
        borderRadius: BorderRadius.circular(26),
        border: Border.all(color: const Color(0xFFD8E7FF)),
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 18, 0, 18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.only(right: 16),
              child: SectionHeader(
                eyebrow: 'Fresh local value',
                title: 'Deals around you',
                actionLabel: 'View all',
                onAction: widget.onViewAll,
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              height: 34,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: tabs.length,
                separatorBuilder: (_, index) => const SizedBox(width: 7),
                itemBuilder: (context, index) => ChoiceChip(
                  visualDensity: VisualDensity.compact,
                  selected: _tab == index,
                  showCheckmark: false,
                  label: Text(tabs[index]),
                  onSelected: (_) => setState(() => _tab = index),
                ),
              ),
            ),
            const SizedBox(height: 12),
            widget.offers.when(
              loading: () => _AutoScrollingList(
                height: 180,
                itemCount: 3,
                step: 270,
                separatorBuilder: (_, index) => const SizedBox(width: 10),
                itemBuilder: (_, index) =>
                    const BncSkeleton(width: 260, height: 180, radius: 20),
              ),
              error: (error, stack) => _HomeSectionNotice(
                icon: Icons.local_offer_outlined,
                title: 'Deals could not be loaded',
                body: 'Open the offers page to try again.',
                actionLabel: 'Open',
                onAction: widget.onViewAll,
                margin: const EdgeInsets.only(right: 16),
              ),
              data: (_) => visible.isEmpty
                  ? _HomeSectionNotice(
                      icon: Icons.sell_outlined,
                      title: 'Fresh deals are on the way',
                      body: 'Check all offers for the latest local savings.',
                      actionLabel: 'View all',
                      onAction: widget.onViewAll,
                      margin: const EdgeInsets.only(right: 16),
                    )
                  : _AutoScrollingList(
                      height: 180,
                      itemCount: visible.length,
                      step: 270,
                      separatorBuilder: (_, index) => const SizedBox(width: 10),
                      itemBuilder: (context, index) => _OfferCard(
                        offer: visible[index],
                        onView: widget.onViewAll,
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class _OfferCard extends StatelessWidget {
  const _OfferCard({required this.offer, required this.onView});

  final Offer offer;
  final VoidCallback onView;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 260,
      child: Card(
        child: InkWell(
          onTap: onView,
          borderRadius: BorderRadius.circular(22),
          child: Padding(
            padding: const EdgeInsets.all(15),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 39,
                      height: 39,
                      decoration: BoxDecoration(
                        color: BncColors.brand,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        Icons.local_offer_rounded,
                        color: Colors.white,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        offer.discount,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          color: BncColors.brand,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  offer.title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                Text(
                  offer.businessName.isEmpty
                      ? offer.description
                      : offer.businessName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(
                    context,
                  ).textTheme.bodySmall?.copyWith(color: BncColors.muted),
                ),
                const Spacer(),
                Row(
                  children: [
                    const Icon(
                      Icons.schedule_rounded,
                      size: 14,
                      color: BncColors.muted,
                    ),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        'Until ${offer.expiresAt}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: BncColors.muted,
                        ),
                      ),
                    ),
                    if (offer.code != null)
                      TextButton.icon(
                        onPressed: () async {
                          await Clipboard.setData(
                            ClipboardData(text: offer.code!),
                          );
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text('${offer.code} copied'),
                                behavior: SnackBarBehavior.floating,
                              ),
                            );
                          }
                        },
                        icon: const Icon(Icons.copy_rounded, size: 14),
                        label: Text(offer.code!),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _HomeBookingSection extends StatelessWidget {
  const _HomeBookingSection({
    required this.state,
    required this.onViewAll,
    required this.onBook,
  });

  final AsyncValue<List<Service>> state;
  final VoidCallback onViewAll;
  final ValueChanged<Service> onBook;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(right: 18),
          child: SectionHeader(
            eyebrow: 'Easy appointments',
            title: 'Book a local expert',
            actionLabel: 'View all',
            onAction: onViewAll,
          ),
        ),
        const SizedBox(height: 12),
        state.when(
          loading: () => const Padding(
            padding: EdgeInsets.only(right: 18),
            child: BncSkeleton(height: 168),
          ),
          error: (error, stack) => _HomeSectionNotice(
            icon: Icons.event_busy_outlined,
            title: 'Appointments are temporarily unavailable',
            body: 'Open the appointment directory to try again.',
            actionLabel: 'Open',
            onAction: onViewAll,
            margin: const EdgeInsets.only(right: 18),
          ),
          data: (items) => items.isEmpty
              ? _HomeSectionNotice(
                  icon: Icons.event_available_outlined,
                  title: 'No appointment services yet',
                  body:
                      'Published provider schedules will appear here when available.',
                  actionLabel: 'Explore',
                  onAction: onViewAll,
                  margin: const EdgeInsets.only(right: 18),
                )
              : _AutoScrollingList(
                  height: 174,
                  padding: const EdgeInsets.only(right: 18),
                  itemCount: items.take(8).length,
                  step: 280,
                  separatorBuilder: (_, _) => const SizedBox(width: 10),
                  itemBuilder: (context, index) => _HomeBookingCard(
                    service: items[index],
                    onTap: () => onBook(items[index]),
                  ),
                ),
        ),
      ],
    );
  }
}

class _HomeBookingCard extends StatelessWidget {
  const _HomeBookingCard({required this.service, required this.onTap});

  final Service service;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 270,
      child: Card(
        color: const Color(0xFFF1F6FF),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(22),
          child: Padding(
            padding: const EdgeInsets.all(15),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 42,
                      height: 42,
                      decoration: BoxDecoration(
                        color: BncColors.brand,
                        borderRadius: BorderRadius.circular(13),
                      ),
                      child: const Icon(
                        Icons.event_available_outlined,
                        color: Colors.white,
                        size: 21,
                      ),
                    ),
                    const Spacer(),
                    Text(
                      service.startingPrice == 0
                          ? 'Free consultation'
                          : 'From ${formatCurrency(service.startingPrice)}',
                      style: Theme.of(context).textTheme.labelMedium?.copyWith(
                        color: BncColors.brand,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
                const Spacer(),
                Text(
                  service.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 3),
                Text(
                  [
                    if (service.businessName.isNotEmpty) service.businessName,
                    if (service.businessLocality.isNotEmpty)
                      service.businessLocality,
                    if (service.duration.isNotEmpty) service.duration,
                  ].join(' · '),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(
                    context,
                  ).textTheme.bodySmall?.copyWith(color: BncColors.muted),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Text(
                      'View live slots',
                      style: Theme.of(context).textTheme.labelLarge?.copyWith(
                        color: BncColors.brand,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(width: 5),
                    const Icon(
                      Icons.arrow_forward_rounded,
                      size: 17,
                      color: BncColors.brand,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _TopServiceCard extends StatelessWidget {
  const _TopServiceCard({required this.service});

  final Service service;

  @override
  Widget build(BuildContext context) {
    final location = [
      service.businessLocality,
      service.businessCity,
    ].where((value) => value.isNotEmpty).join(', ');
    return SizedBox(
      width: 300,
      child: Card(
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: () => context.push('/services/${service.id}'),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                height: 108,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    BncNetworkImage(url: service.imageUrl),
                    const DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [Colors.black45, Colors.transparent],
                        ),
                      ),
                    ),
                    const Positioned(
                      left: 10,
                      top: 10,
                      child: StatusBadge(
                        label: 'Top service',
                        color: BncColors.deepBlue,
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(13, 10, 13, 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              service.name,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: Theme.of(context).textTheme.titleSmall
                                  ?.copyWith(fontWeight: FontWeight.w800),
                            ),
                          ),
                          if (service.businessVerified)
                            const Padding(
                              padding: EdgeInsets.only(left: 5),
                              child: Icon(
                                Icons.verified_rounded,
                                color: BncColors.brand,
                                size: 17,
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 3),
                      Text(
                        service.businessName,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(
                          context,
                        ).textTheme.bodySmall?.copyWith(color: BncColors.muted),
                      ),
                      const SizedBox(height: 7),
                      Row(
                        children: [
                          RatingLabel(
                            rating: service.businessRating,
                            count: service.businessReviewCount,
                          ),
                          const Spacer(),
                          Text(
                            'From ${formatCurrency(service.startingPrice)}',
                            style: Theme.of(context).textTheme.labelMedium
                                ?.copyWith(
                                  color: BncColors.deepBlue,
                                  fontWeight: FontWeight.w800,
                                ),
                          ),
                        ],
                      ),
                      const Spacer(),
                      Row(
                        children: [
                          const Icon(
                            Icons.location_on_outlined,
                            size: 14,
                            color: BncColors.brand,
                          ),
                          const SizedBox(width: 3),
                          Expanded(
                            child: Text(
                              location.isEmpty
                                  ? 'Location available on enquiry'
                                  : location,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: Theme.of(context).textTheme.labelSmall
                                  ?.copyWith(color: BncColors.muted),
                            ),
                          ),
                          if (service.bncStarLevel > 0)
                            Text(
                              bncMembershipLabel(
                                service.bncStarLevel,
                                service.planName,
                              ),
                              style: Theme.of(context).textTheme.labelSmall
                                  ?.copyWith(
                                    color: BncColors.deepBlue,
                                    fontWeight: FontWeight.w700,
                                  ),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _HomeJobsSection extends StatelessWidget {
  const _HomeJobsSection({
    required this.state,
    required this.onViewAll,
    required this.onOpen,
  });

  final AsyncValue<List<Json>> state;
  final VoidCallback onViewAll;
  final ValueChanged<String> onOpen;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(right: 18),
          child: SectionHeader(
            eyebrow: 'Work close to home',
            title: 'Latest local jobs',
            actionLabel: 'View all',
            onAction: onViewAll,
          ),
        ),
        const SizedBox(height: 12),
        state.when(
          loading: () => const Padding(
            padding: EdgeInsets.only(right: 18),
            child: BncSkeleton(height: 170),
          ),
          error: (error, stack) => _HomeSectionNotice(
            icon: Icons.work_outline_rounded,
            title: 'Jobs are temporarily unavailable',
            body: 'Open the jobs directory to try again.',
            actionLabel: 'Open',
            onAction: onViewAll,
            margin: const EdgeInsets.only(right: 18),
          ),
          data: (items) => items.isEmpty
              ? _HomeSectionNotice(
                  icon: Icons.work_outline_rounded,
                  title: 'No open local roles yet',
                  body: 'Published jobs from nearby businesses appear here.',
                  actionLabel: 'Explore',
                  onAction: onViewAll,
                  margin: const EdgeInsets.only(right: 18),
                )
              : _AutoScrollingList(
                  height: 176,
                  padding: const EdgeInsets.only(right: 18),
                  itemCount: items.take(8).length,
                  step: 280,
                  separatorBuilder: (_, _) => const SizedBox(width: 10),
                  itemBuilder: (context, index) => _HomeJobCard(
                    job: items[index],
                    onTap: () => onOpen(items[index].string('id')),
                  ),
                ),
        ),
      ],
    );
  }
}

class _HomeJobCard extends StatelessWidget {
  const _HomeJobCard({required this.job, required this.onTap});

  final Json job;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final business = job['business'] is Map
        ? Map<String, dynamic>.from(job['business'] as Map)
        : const <String, dynamic>{};
    final salaryMin = job.decimal('salaryMin');
    final salaryMax = job.decimal('salaryMax');
    final salary = salaryMin > 0 && salaryMax > 0
        ? '${formatCurrency(salaryMin)}–${formatCurrency(salaryMax)}'
        : salaryMin > 0
        ? 'From ${formatCurrency(salaryMin)}'
        : 'Salary on application';
    return SizedBox(
      width: 270,
      child: Card(
        color: const Color(0xFFF1F6FF),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(22),
          child: Padding(
            padding: const EdgeInsets.all(15),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 42,
                      height: 42,
                      decoration: BoxDecoration(
                        color: BncColors.brand,
                        borderRadius: BorderRadius.circular(13),
                      ),
                      child: const Icon(
                        Icons.work_outline_rounded,
                        color: Colors.white,
                        size: 21,
                      ),
                    ),
                    const Spacer(),
                    Text(
                      job.string('employmentType').replaceAll('_', ' '),
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: BncColors.brand,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
                const Spacer(),
                Text(
                  job.string('title', 'Local role'),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 3),
                Text(
                  [
                    business.string('name'),
                    job.string('city'),
                  ].where((value) => value.isNotEmpty).join(' · '),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(
                    context,
                  ).textTheme.bodySmall?.copyWith(color: BncColors.muted),
                ),
                const SizedBox(height: 10),
                Text(
                  salary,
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                    color: BncColors.brand,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _CityCard extends StatelessWidget {
  const _CityCard({required this.city, required this.onTap});

  final Json city;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 235,
      child: Card(
        color: const Color(0xFFF0F6FF),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(22),
          child: Padding(
            padding: const EdgeInsets.all(15),
            child: Row(
              children: [
                Container(
                  width: 46,
                  height: 46,
                  decoration: BoxDecoration(
                    color: BncColors.brand,
                    borderRadius: BorderRadius.circular(15),
                  ),
                  child: const Icon(
                    Icons.location_city_rounded,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(width: 11),
                Expanded(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        city.string('city'),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      Text(
                        [
                          city.string('district'),
                          '${city.integer('businessCount')} active businesses',
                        ].where((value) => value.isNotEmpty).join(' · '),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: BncColors.muted,
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(
                  Icons.arrow_forward_rounded,
                  color: BncColors.brand,
                  size: 18,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

Future<void> _launchHomeUrl(BuildContext context, String url) async {
  var launched = false;
  try {
    launched = await launchUrl(
      Uri.parse(url),
      mode: LaunchMode.externalApplication,
    );
  } on Object {
    launched = false;
  }
  if (!launched && context.mounted) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('This action is not available on this device.'),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}

const _popularSearches = [
  'Grocery',
  'Doctors',
  'Restaurants',
  'Electricians',
  'Beauty',
  'Photographers',
];
