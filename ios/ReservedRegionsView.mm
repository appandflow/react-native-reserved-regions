#import "ReservedRegionsView.h"

#import <react/renderer/components/ReservedRegionsViewSpec/ComponentDescriptors.h>
#import <react/renderer/components/ReservedRegionsViewSpec/EventEmitters.h>
#import <react/renderer/components/ReservedRegionsViewSpec/Props.h>
#import <react/renderer/components/ReservedRegionsViewSpec/RCTComponentViewHelpers.h>

#import "RCTFabricComponentsPlugins.h"

using namespace facebook::react;

@implementation ReservedRegionsView {
  NSArray<NSDictionary *> *_currentRegions;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<ReservedRegionsViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const ReservedRegionsViewProps>();
    _props = defaultProps;
  }
  return self;
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  [self updateRegions];
}

- (void)didMoveToWindow
{
  [super didMoveToWindow];
  [self updateRegions];
}

- (void)updateRegions
{
  if (self.window == nil || !_eventEmitter) {
    return;
  }

  NSMutableArray<NSDictionary *> *regions = [NSMutableArray new];
#if defined(__IPHONE_27_1) && __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_27_1
  if (@available(iOS 27.1, *)) {
    NSArray<UIViewReservedRegionKind *> *kinds = @[
      UIViewReservedRegionKind.divisionRegionKind,
      UIViewReservedRegionKind.occlusionRegionKind,
    ];
    NSArray<NSString *> *names = @[@"division", @"occlusion"];
    for (NSUInteger index = 0; index < kinds.count; index++) {
      for (UIViewReservedRegion *region in [self reservedRegionsOfKind:kinds[index]
                                                              options:UIViewReservedRegionQueryOptionsNone]) {
        [regions addObject:@{@"kind": names[index], @"frame": [NSValue valueWithCGRect:region.frame]}];
      }
    }
  }
#endif

  if ([_currentRegions isEqualToArray:regions]) {
    return;
  }
  _currentRegions = [regions copy];

  ReservedRegionsViewEventEmitter::OnRegionsChange event;
  for (NSDictionary *region in regions) {
    CGRect frame = [region[@"frame"] CGRectValue];
    event.regions.push_back({
        [region[@"kind"] UTF8String],
        {frame.origin.x, frame.origin.y, frame.size.width, frame.size.height},
        false,
    });
  }
  std::static_pointer_cast<ReservedRegionsViewEventEmitter const>(_eventEmitter)->onRegionsChange(event);
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _currentRegions = nil;
}

@end
